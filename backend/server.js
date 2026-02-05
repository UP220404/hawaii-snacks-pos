// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket conexiones
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Crear/conectar base de datos SQLite
const db = new sqlite3.Database('./hawaii_snacks.db');

// Crear tablas si no existen
db.serialize(() => {
  // Tabla de productos
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      categoria TEXT NOT NULL,
      descripcion TEXT,
      activo BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de opciones para productos
  db.run(`
    CREATE TABLE IF NOT EXISTS opciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  // Tabla de toppings para productos
  db.run(`
    CREATE TABLE IF NOT EXISTS toppings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL DEFAULT 0,
      categoria TEXT DEFAULT 'normal',
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  // Tabla de ventas
  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      estado TEXT DEFAULT 'completada'
    )
  `);

  // Tabla de items de venta
  db.run(`
    CREATE TABLE IF NOT EXISTS venta_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      opciones TEXT,
      toppings TEXT,
      FOREIGN KEY (venta_id) REFERENCES ventas(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )
  `);

  // Tabla de pedidos para cocina
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos_cocina (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      items TEXT NOT NULL,
      estado TEXT DEFAULT 'pendiente',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_completado DATETIME,
      FOREIGN KEY (venta_id) REFERENCES ventas(id)
    )
  `);

  // Insertar datos iniciales si la tabla está vacía
  db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
    if (row.count === 0) {
      // Productos del menú Hawaii Snacks
      const productos = [
        // Postres Helados
        { nombre: 'Paleta de hielo preparada', precio: 35, categoria: 'Postres Helados', descripcion: 'Paleta del sabor a elegir (mango, limón, fresa, tamarindo o uva) con chamitas, chamoy, pepino, jícama y limón.' },
        { nombre: 'Fresas con chocolate', precio: 20, categoria: 'Postres Helados' },
        { nombre: 'Chocobananas', precio: 13, categoria: 'Postres Helados' },
        
        // Crepas
        { nombre: 'Crepas', precio: 50, categoria: 'Crepas', descripcion: 'Incluye 1 salsa dulce y el topping favorito a tu elección. Ingrediente extra: De $5 - $10' },
        
        // Hot Cakes
        { nombre: 'Mini hot cakes chico', precio: 30, categoria: 'Hot Cakes', descripcion: '8 piezas. Incluye 1 salsa dulce y el topping favorito a tu elección.' },
        { nombre: 'Mini hot cakes grande', precio: 45, categoria: 'Hot Cakes', descripcion: '16 piezas. Incluye 1 salsa dulce y el topping favorito a tu elección.' },
        
        // Salado
        { nombre: 'Duro preparado', precio: 35, categoria: 'Salado', descripcion: 'Preparado con lechuga, jitomate, cueritos, aguacate, queso, crema y salsa.' },
        { nombre: 'Frituras con salsa', precio: 12, categoria: 'Salado' },
        { nombre: 'Papas con limón y salsa', precio: 30, categoria: 'Salado' },
        { nombre: 'Papas con cueritos', precio: 35, categoria: 'Salado' },
        { nombre: 'Papas con cueritos, queso y chiles', precio: 45, categoria: 'Salado' },
        { nombre: 'Tostitos o doritos con queso y chiles', precio: 40, categoria: 'Salado' },
        { nombre: 'Tostitos o doritos con queso y cueritos', precio: 45, categoria: 'Salado' },
        { nombre: 'Tostitos o doritos con queso, cueritos y elote', precio: 50, categoria: 'Salado' },
        
        // Biónicos
        { nombre: 'Biónico chico', precio: 25, categoria: 'Biónicos', descripcion: 'Frutas: Plátano, fresa, manzana, melón, papaya y durazno.' },
        { nombre: 'Biónico mediano', precio: 40, categoria: 'Biónicos', descripcion: 'Frutas: Plátano, fresa, manzana, melón, papaya y durazno.' },
        { nombre: 'Biónico grande', precio: 50, categoria: 'Biónicos', descripcion: 'Frutas: Plátano, fresa, manzana, melón, papaya y durazno.' },
        
        // Bebidas
        { nombre: 'Frappé de galleta', precio: 45, categoria: 'Bebidas' },
        { nombre: 'Rusas', precio: 23, categoria: 'Bebidas' },
        { nombre: 'Arizona preparado', precio: 35, categoria: 'Bebidas', descripcion: 'Bebida fría preparada con 5 tipos de gomitas, una vara de tamarindo, chamoy líquido y en polvo; jícama y pepino.' },
        { nombre: 'Licuado (chocoas de 1/2 litro)', precio: 25, categoria: 'Bebidas', descripcion: 'Chocolate, fresa kiwi, mango, y sandía, cajeta, coco, capuchino y galleta' },
        
        // Mini Donas
        { nombre: 'Donas chicas de chocolate', precio: 30, categoria: 'Mini Donas', descripcion: '7 piezas. Incluye 1 salsa dulce y el topping favorito a tu elección.' },
        { nombre: 'Donas grandes de chocolate', precio: 45, categoria: 'Mini Donas', descripcion: '14 piezas. Incluye 1 salsa dulce y el topping favorito a tu elección.' },
        
        // Waffles
        { nombre: 'Waffles (1 pieza)', precio: 25, categoria: 'Waffles', descripcion: 'Incluye mermelada de fresa, 1 salsa dulce y el topping favorito a tu elección.' },
        { nombre: 'Waffles (3 piezas)', precio: 40, categoria: 'Waffles', descripcion: 'Incluye mermelada de fresa, 1 salsa dulce y el topping favorito a tu elección.' },
        
        // Fresas con Crema
        { nombre: 'Fresas con crema chicas', precio: 40, categoria: 'Fresas con Crema' },
        { nombre: 'Fresas con crema medianas', precio: 55, categoria: 'Fresas con Crema' },
        { nombre: 'Fresas con crema grandes', precio: 65, categoria: 'Fresas con Crema' },
        
        // Duraznos con Crema
        { nombre: 'Duraznos con crema chicos', precio: 50, categoria: 'Duraznos con Crema' },
        { nombre: 'Duraznos con crema medianos', precio: 60, categoria: 'Duraznos con Crema' },
        { nombre: 'Duraznos con crema grandes', precio: 70, categoria: 'Duraznos con Crema' }
      ];

      productos.forEach((producto, index) => {
        db.run(
          "INSERT INTO productos (nombre, precio, categoria, descripcion) VALUES (?, ?, ?, ?)",
          [producto.nombre, producto.precio, producto.categoria, producto.descripcion || ''],
          function(err) {
            if (!err) {
              const productoId = this.lastID;
              
              // Opciones específicas por categoría
              const opcionesPorCategoria = {
                'Crepas': [
                  { nombre: 'Queso o crema', precio: 0 },
                  { nombre: 'Mermelada de fresa', precio: 0 },
                  { nombre: 'Nutella', precio: 0 },
                  { nombre: 'Crema de cacahuate', precio: 0 },
                  { nombre: 'Cajeta', precio: 0 }
                ],
                'Postres Helados': [
                  { nombre: 'Mango', precio: 0 },
                  { nombre: 'Limón', precio: 0 },
                  { nombre: 'Fresa', precio: 0 },
                  { nombre: 'Tamarindo', precio: 0 },
                  { nombre: 'Uva', precio: 0 }
                ],
                'Hot Cakes': [
                  { nombre: 'Con salsa dulce', precio: 0 },
                  { nombre: 'Natural', precio: 0 }
                ],
                'Bebidas': [
                  { nombre: 'Chocolate', precio: 0 },
                  { nombre: 'Fresa kiwi', precio: 0 },
                  { nombre: 'Mango', precio: 0 },
                  { nombre: 'Sandía', precio: 0 },
                  { nombre: 'Cajeta', precio: 0 },
                  { nombre: 'Coco', precio: 0 },
                  { nombre: 'Capuchino', precio: 0 },
                  { nombre: 'Galleta', precio: 0 }
                ]
              };

              // Toppings del menú
              const toppingsGenerales = [
                // Toppings normales (gratis)
                { nombre: 'Chocoretas', precio: 0, categoria: 'normal' },
                { nombre: 'Chocokrispis', precio: 0, categoria: 'normal' },
                { nombre: 'Zucaritas de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Granillo de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Granillo de colores', precio: 0, categoria: 'normal' },
                { nombre: 'Chispas de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Lunetas de yogurth', precio: 0, categoria: 'normal' },
                { nombre: 'Lunetas de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Nuez', precio: 0, categoria: 'normal' },
                { nombre: 'Granola', precio: 0, categoria: 'normal' },
                { nombre: 'Amaranto natural', precio: 0, categoria: 'normal' },
                { nombre: 'Pasas con chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Galleta cubierta de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Mini galleta oreo', precio: 0, categoria: 'normal' },
                { nombre: 'Huevitos blancos de chocolate', precio: 0, categoria: 'normal' },
                { nombre: 'Huevitos de chocolate c/ cacahuate', precio: 0, categoria: 'normal' },
                { nombre: 'Freskas', precio: 0, categoria: 'normal' },
                { nombre: 'Kranky', precio: 0, categoria: 'normal' },
                
                // Toppings especiales (+$10)
                { nombre: 'Gansito', precio: 10, categoria: 'especial' },
                { nombre: 'Chocorol', precio: 10, categoria: 'especial' },
                { nombre: 'Pinguino', precio: 10, categoria: 'especial' },
                { nombre: 'Galleta oreo', precio: 10, categoria: 'especial' }
              ];

              // Salsas dulces
              const salsasDulces = [
                { nombre: 'Lechera', precio: 0, categoria: 'salsa' },
                { nombre: 'Hersheys', precio: 0, categoria: 'salsa' },
                { nombre: 'Cajeta', precio: 0, categoria: 'salsa' },
                { nombre: 'Miel de maple', precio: 0, categoria: 'salsa' }
              ];

              // Insertar opciones específicas
              if (opcionesPorCategoria[producto.categoria]) {
                opcionesPorCategoria[producto.categoria].forEach(opcion => {
                  db.run(
                    "INSERT INTO opciones (producto_id, nombre, precio) VALUES (?, ?, ?)",
                    [productoId, opcion.nombre, opcion.precio]
                  );
                });
              }

              // Insertar toppings para productos que los necesiten
              const categoríasConToppings = ['Crepas', 'Hot Cakes', 'Mini Donas', 'Waffles', 'Biónicos'];
              if (categoríasConToppings.includes(producto.categoria)) {
                [...toppingsGenerales, ...salsasDulces].forEach(topping => {
                  db.run(
                    "INSERT INTO toppings (producto_id, nombre, precio, categoria) VALUES (?, ?, ?, ?)",
                    [productoId, topping.nombre, topping.precio, topping.categoria]
                  );
                });
              }

              // Frutas para productos específicos
              const frutasDisponibles = [
                { nombre: 'Plátano', precio: 0 },
                { nombre: 'Fresa', precio: 0 },
                { nombre: 'Manzana', precio: 0 },
                { nombre: 'Melón', precio: 0 },
                { nombre: 'Papaya', precio: 0 },
                { nombre: 'Durazno', precio: 0 }
              ];

              if (['Crepas', 'Hot Cakes', 'Mini Donas', 'Waffles'].includes(producto.categoria)) {
                frutasDisponibles.forEach(fruta => {
                  db.run(
                    "INSERT INTO toppings (producto_id, nombre, precio, categoria) VALUES (?, ?, ?, ?)",
                    [productoId, fruta.nombre, fruta.precio, 'fruta']
                  );
                });
              }
            }
          }
        );
      });
    }
  });
});

// RUTAS DE LA API

// Obtener todos los productos con sus opciones y toppings
app.get('/api/productos', (req, res) => {
  const incluirInactivos = req.query.incluir_inactivos || 'false';
  
  db.all(
    `SELECT p.*, 
            GROUP_CONCAT(DISTINCT o.id || ':' || o.nombre || ':' || o.precio) as opciones,
            GROUP_CONCAT(DISTINCT t.id || ':' || t.nombre || ':' || t.precio || ':' || t.categoria) as toppings
     FROM productos p 
     LEFT JOIN opciones o ON p.id = o.producto_id
     LEFT JOIN toppings t ON p.id = t.producto_id
     WHERE (p.activo = 1 OR ? = 'true')
     GROUP BY p.id
     ORDER BY p.categoria, p.nombre`,
    [incluirInactivos],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const productos = rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        precio: row.precio,
        categoria: row.categoria,
        descripcion: row.descripcion,
        activo: row.activo === 1 || row.activo === true,
        opciones: row.opciones ? row.opciones.split(',').map(opt => {
          const parts = opt.split(':');
          const id = parts[0];
          const precio = parts[parts.length - 1];
          const nombre = parts.slice(1, -1).join(':');
          return { id: parseInt(id), nombre, precio: parseFloat(precio) };
        }) : [],
        toppings: row.toppings ? row.toppings.split(',').map(top => {
          const parts = top.split(':');
          const id = parts[0];
          const categoria = parts[parts.length - 1];
          const precio = parts[parts.length - 2];
          const nombre = parts.slice(1, -2).join(':');
          return { id: parseInt(id), nombre, precio: parseFloat(precio), categoria };
        }) : []
      }));
      
      res.json(productos);
    }
  );
});

// Crear nuevo producto
app.post('/api/productos', (req, res) => {
  const { nombre, precio, categoria, descripcion, opciones, toppings } = req.body;
  
  
  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ error: 'Campos requeridos faltantes' });
  }
  
  if (precio <= 0) {
    return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
  }
  
  db.run(
    "INSERT INTO productos (nombre, precio, categoria, descripcion) VALUES (?, ?, ?, ?)",
    [nombre, precio, categoria, descripcion || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const productoId = this.lastID;
      
      // Insertar opciones
      if (opciones && opciones.length > 0) {
        opciones.forEach(opcion => {
          db.run(
            "INSERT INTO opciones (producto_id, nombre, precio) VALUES (?, ?, ?)",
            [productoId, opcion.nombre, opcion.precio || 0]
          );
        });
      }
      
      // Insertar toppings
      if (toppings && toppings.length > 0) {
        toppings.forEach(topping => {
          db.run(
            "INSERT INTO toppings (producto_id, nombre, precio, categoria) VALUES (?, ?, ?, ?)",
            [productoId, topping.nombre, topping.precio || 0, topping.categoria || 'normal']
          );
        });
      }
      
      res.json({ id: productoId, message: 'Producto creado exitosamente' });
    }
  );
});

// Actualizar producto
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, descripcion } = req.body;
  
  db.run(
    "UPDATE productos SET nombre = ?, precio = ?, categoria = ?, descripcion = ? WHERE id = ?",
    [nombre, precio, categoria, descripcion || '', id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Producto actualizado exitosamente' });
    }
  );
});

// Eliminar producto (soft delete)
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    "UPDATE productos SET activo = 0 WHERE id = ?",
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Producto eliminado exitosamente' });
    }
  );
});

// Procesar venta y crear pedido para cocina
app.post('/api/ventas', (req, res) => {
  const { items, total } = req.body;

  // Validaciones
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item en la venta' });
  }

  if (!total || total <= 0) {
    return res.status(400).json({ error: 'El total debe ser mayor a 0' });
  }

  db.run(
    "INSERT INTO ventas (total) VALUES (?)",
    [total],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const ventaId = this.lastID;
      
      // Insertar items de la venta
      items.forEach(item => {
        db.run(
          `INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, opciones, toppings) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ventaId, 
            item.producto_id, 
            item.cantidad, 
            item.precio_unitario,
            JSON.stringify(item.opciones || []),
            JSON.stringify(item.toppings || [])
          ]
        );
      });
      
      // Crear pedido para cocina
      db.run(
        "INSERT INTO pedidos_cocina (venta_id, items) VALUES (?, ?)",
        [ventaId, JSON.stringify(items)],
        function(err) {
          if (err) {
            console.error('Error creando pedido para cocina:', err);
          } else {
            // Emitir evento WebSocket para cocina
            const pedidoId = this.lastID;
            io.emit('nuevo-pedido', {
              id: pedidoId,
              venta_id: ventaId,
              items: items,
              estado: 'pendiente',
              fecha_creacion: new Date().toISOString(),
              total: total
            });
            console.log('📢 Nuevo pedido emitido:', pedidoId);
          }
        }
      );

      res.json({ id: ventaId, message: 'Venta procesada exitosamente' });
    }
  );
});



// Obtener pedidos para cocina
app.get('/api/pedidos-cocina', (req, res) => {
  db.all(
    `SELECT pc.*, v.total, v.fecha as fecha_venta
     FROM pedidos_cocina pc
     JOIN ventas v ON pc.venta_id = v.id
     ORDER BY pc.fecha_creacion DESC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const pedidos = rows.map(row => {
        let items;
        try {
          items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
        } catch (error) {
          console.error('Error parsing items in backend:', error);
          items = [];
        }
        
        return {
          ...row,
          items: items
        };
      });
      
      res.json(pedidos);
    }
  );
});


// Actualizar estado de pedido en cocina
app.put('/api/pedidos-cocina/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  const fechaCompletado = estado === 'completado' ? new Date().toISOString() : null;
  
  db.run(
    "UPDATE pedidos_cocina SET estado = ?, fecha_completado = ? WHERE id = ?",
    [estado, fechaCompletado, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Emitir evento WebSocket de actualización
      io.emit('pedido-actualizado', {
        id: parseInt(id),
        estado: estado,
        fecha_completado: fechaCompletado
      });
      console.log('📢 Pedido actualizado:', id, '->', estado);

      res.json({ message: 'Estado del pedido actualizado' });
    }
  );
});

// Obtener ventas
app.get('/api/ventas', (req, res) => {
  db.all(
    `SELECT v.*, 
            COUNT(vi.id) as total_items,
            GROUP_CONCAT(p.nombre) as productos
     FROM ventas v
     LEFT JOIN venta_items vi ON v.id = vi.venta_id
     LEFT JOIN productos p ON vi.producto_id = p.id
     GROUP BY v.id
     ORDER BY v.fecha DESC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Obtener estadísticas
app.get('/api/estadisticas', (req, res) => {
  const queries = {
    ventasHoy: `
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM ventas 
      WHERE DATE(fecha) = DATE('now')
    `,
    productosVendidos: `
      SELECT p.nombre, SUM(vi.cantidad) as cantidad
      FROM venta_items vi
      JOIN productos p ON vi.producto_id = p.id
      JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.fecha) = DATE('now')
      GROUP BY p.id
      ORDER BY cantidad DESC
      LIMIT 5
    `
  };

  const stats = {};
  
  db.get(queries.ventasHoy, (err, row) => {
    if (!err) {
      stats.ventasHoy = row;
    }
    
    db.all(queries.productosVendidos, (err, rows) => {
      if (!err) {
        stats.productosVendidos = rows;
      }
      res.json(stats);
    });
  });
});

// Limpiar ventas y pedidos (mantiene productos)
app.delete('/api/reset-ventas', (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM venta_items");
    db.run("DELETE FROM pedidos_cocina");
    db.run("DELETE FROM ventas", function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('🗑️ Ventas y pedidos eliminados');
      res.json({ message: 'Ventas y pedidos eliminados exitosamente' });
    });
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor con WebSockets
server.listen(PORT, () => {
  console.log(`🏝️ Hawaii Snacks Server corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: hawaii_snacks.db`);
  console.log(`🔌 WebSockets habilitados`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('✅ Conexión a la base de datos cerrada.');
    process.exit(0);
  });   
});
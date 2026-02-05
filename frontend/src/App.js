import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  BarChart3, 
  Package, 
  ChefHat,
  CheckCircle,
  Clock,
  X,
  Edit,
  Save,
  Sparkles,
  TrendingUp,
  Award,
  Star,
  Filter,
  Search,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  Settings,
  Download,
  RefreshCw,
  Zap,
  Heart,
  Flame,
  Sun,
  Crown,
  Gift,
  Coffee,
  Cake,
  IceCream,
  Waves,
  Palmtree,
  Sunset,
  Flower2,
  Cherry,
  Apple,
  Menu,
  Printer,
  Wifi,
  WifiOff
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  // Leer vista inicial de URL (ej: ?vista=cocina)
  const getVistaInicial = () => {
    const params = new URLSearchParams(window.location.search);
    const vistaParam = params.get('vista');
    if (['ventas', 'cocina', 'admin', 'reportes'].includes(vistaParam)) {
      return vistaParam;
    }
    return 'ventas';
  };

  const [vista, setVista] = useState(getVistaInicial);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState([]);
  const [toppingsSeleccionados, setToppingsSeleccionados] = useState([]);
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState([]);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [socketConectado, setSocketConectado] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [montoPago, setMontoPago] = useState('');
  const socketRef = useRef(null);

  // Conexión WebSocket
  useEffect(() => {
    socketRef.current = io(API_BASE_URL.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 Conectado al servidor');
      setSocketConectado(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Desconectado del servidor');
      setSocketConectado(false);
    });

    // Escuchar nuevos pedidos
    socketRef.current.on('nuevo-pedido', (pedido) => {
      console.log('📢 Nuevo pedido recibido:', pedido);
      setPedidosCocina(prev => [pedido, ...prev]);
      if (vista === 'cocina') {
        mostrarNotificacion('🍳 Nuevo pedido recibido!', 'success');
      }
    });

    // Escuchar actualizaciones de pedidos
    socketRef.current.on('pedido-actualizado', (data) => {
      console.log('📢 Pedido actualizado:', data);
      setPedidosCocina(prev => prev.map(p =>
        p.id === data.id
          ? { ...p, estado: data.estado, fecha_completado: data.fecha_completado }
          : p
      ));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    setIsLoading(true);
    cargarProductos();
    cargarPedidosCocina();
    cargarVentas();
    cargarEstadisticas();
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Ya no necesitamos polling - WebSockets maneja actualizaciones en tiempo real

  const cargarProductos = async (incluirInactivos = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos?incluir_inactivos=${incluirInactivos}`);
      const data = await response.json();
      console.log('Productos cargados:', data); // Debug
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      mostrarNotificacion('Error al cargar productos', 'error');
    }
  };

  const cargarPedidosCocina = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-cocina`);
      const data = await response.json();
      
      const pedidosLimpios = data.map(pedido => ({
        ...pedido,
        items: typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items
      }));
      
      setPedidosCocina(pedidosLimpios);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  const cargarVentas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ventas`);
      const data = await response.json();
      setVentas(data);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticas`);
      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Sistema de notificaciones mejorado con toast
  const mostrarNotificacion = (mensaje, tipo = 'info') => {
    const id = Date.now();
    const nuevaNotificacion = {
      id,
      mensaje,
      tipo,
      visible: true
    };

    setNotificaciones(prev => [...prev, nuevaNotificacion]);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, visible: false } : notif
        )
      );
      
      // Remover completamente después de la animación
      setTimeout(() => {
        setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      }, 300);
    }, 4000);
  };

  // Componente de notificaciones toast
  const NotificacionesToast = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notificaciones.map((notif) => {
        const config = {
          success: { 
            bg: 'from-green-500 to-emerald-600', 
            icon: '🌺', 
            border: 'border-green-400' 
          },
          error: { 
            bg: 'from-red-500 to-pink-600', 
            icon: '🌋', 
            border: 'border-red-400' 
          },
          warning: { 
            bg: 'from-yellow-500 to-orange-600', 
            icon: '🏄‍♂️', 
            border: 'border-yellow-400' 
          },
          info: { 
            bg: 'from-blue-500 to-cyan-600', 
            icon: '🏖️', 
            border: 'border-blue-400' 
          }
        };
        
        const currentConfig = config[notif.tipo];
        
        return (
          <div
            key={notif.id}
            className={`transform transition-all duration-300 ${
              notif.visible 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-full opacity-0 scale-95'
            }`}
          >
            <div className={`bg-gradient-to-r ${currentConfig.bg} text-white p-4 rounded-2xl shadow-2xl border-2 ${currentConfig.border} min-w-80 max-w-md`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentConfig.icon}</span>
                <p className="font-bold text-white flex-1">{notif.mensaje}</p>
                <button
                  onClick={() => setNotificaciones(prev => prev.filter(n => n.id !== notif.id))}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))];

  // Componente Modal de Cobro
  const ModalCobro = () => {
    const total = calcularTotalCarrito();
    const pago = parseFloat(montoPago) || 0;
    const cambio = pago - total;
    const puedeConfirmar = pago >= total;

    const botonesRapidos = [20, 50, 100, 200, 500];

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[75] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center">
                <DollarSign className="mr-2" size={28} />
                Cobrar
              </h3>
              <button
                onClick={() => setMostrarCobro(false)}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30"
              >
                <X className="text-white" size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Resumen del pedido */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Total a cobrar:</div>
              <div className="text-4xl font-black text-gray-900">${total.toFixed(2)}</div>
            </div>

            {/* Input de pago */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cliente paga con:
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                <input
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 text-3xl font-black border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-center"
                  autoFocus
                />
              </div>
            </div>

            {/* Botones rápidos */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {botonesRapidos.map((valor) => (
                <button
                  key={valor}
                  onClick={() => setMontoPago(valor.toString())}
                  className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
                >
                  ${valor}
                </button>
              ))}
            </div>

            {/* Botón exacto */}
            <button
              onClick={() => setMontoPago(total.toFixed(2))}
              className="w-full py-3 mb-6 bg-blue-100 hover:bg-blue-200 rounded-xl font-bold text-blue-700 transition-colors"
            >
              Pago exacto (${total.toFixed(2)})
            </button>

            {/* Cambio */}
            <div className={`rounded-2xl p-4 mb-6 ${puedeConfirmar ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold ${puedeConfirmar ? 'text-green-700' : 'text-red-700'}`}>
                  {puedeConfirmar ? 'Cambio a devolver:' : 'Falta:'}
                </span>
                <span className={`text-3xl font-black ${puedeConfirmar ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(cambio).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-4">
              <button
                onClick={() => setMostrarCobro(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => puedeConfirmar && procesarVenta(pago)}
                disabled={!puedeConfirmar}
                className={`flex-1 py-4 rounded-2xl font-black text-white transition-all ${
                  puedeConfirmar
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Ticket para impresión
  const TicketImpresion = ({ venta, onClose }) => {
    const ticketRef = useRef(null);

    const imprimirTicket = () => {
      const contenido = ticketRef.current.innerHTML;
      const ventanaImpresion = window.open('', '_blank', 'width=300,height=600');
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Ticket #${venta.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 280px;
                padding: 10px;
              }
              .header { text-align: center; margin-bottom: 15px; }
              .titulo { font-size: 18px; font-weight: bold; }
              .subtitulo { font-size: 10px; color: #666; }
              .linea { border-top: 1px dashed #000; margin: 10px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .item-nombre { flex: 1; }
              .item-precio { text-align: right; min-width: 60px; }
              .extras { font-size: 10px; color: #666; margin-left: 10px; }
              .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
              .footer { text-align: center; margin-top: 20px; font-size: 10px; }
              @media print {
                body { width: 100%; }
              }
            </style>
          </head>
          <body>
            ${contenido}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[80] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <h3 className="text-2xl font-black flex items-center">
              <Printer className="mr-3" size={28} />
              Ticket de Venta
            </h3>
          </div>

          {/* Preview del ticket */}
          <div className="p-6 bg-gray-50">
            <div ref={ticketRef} className="bg-white p-4 rounded-xl shadow-inner font-mono text-sm">
              <div className="header">
                <div className="titulo">HAWAII SNACKS</div>
                <div className="subtitulo">Sistema POS Tropical</div>
                <div className="subtitulo">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
              </div>

              <div className="linea"></div>
              <div style={{fontWeight: 'bold', marginBottom: '5px'}}>Ticket #{venta.id}</div>
              <div className="linea"></div>

              {venta.items.map((item, idx) => (
                <div key={idx} style={{marginBottom: '8px'}}>
                  <div className="item">
                    <span className="item-nombre">{item.cantidad}x {item.nombre}</span>
                    <span className="item-precio">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                  {item.opciones && item.opciones.length > 0 && (
                    <div className="extras">+ {item.opciones.map(o => o.nombre).join(', ')}</div>
                  )}
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="extras">+ {item.toppings.map(t => t.nombre).join(', ')}</div>
                  )}
                </div>
              ))}

              <div className="linea"></div>
              <div className="item total">
                <span>TOTAL:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>

              {venta.pago && (
                <>
                  <div className="item" style={{marginTop: '5px'}}>
                    <span>Pago:</span>
                    <span>${venta.pago.toFixed(2)}</span>
                  </div>
                  <div className="item" style={{fontWeight: 'bold'}}>
                    <span>Cambio:</span>
                    <span>${venta.cambio.toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="linea"></div>

              <div className="footer">
                <div>¡Gracias por su compra!</div>
                <div>Hawaii Snacks</div>
              </div>
            </div>
          </div>

          <div className="p-6 flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={imprimirTicket}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 font-bold flex items-center justify-center"
            >
              <Printer className="mr-2" size={20} />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Iconos por categoría más hawaianos
  const getIconoCategoria = (categoria) => {
    const iconos = {
      'Postres Helados': IceCream,
      'Crepas': Coffee,
      'Hot Cakes': Cake,
      'Salado': Target,
      'Biónicos': Cherry,
      'Bebidas': Coffee,
      'Mini Donas': Gift,
      'Waffles': Crown,
      'Fresas con Crema': Heart,
      'Duraznos con Crema': Sun
    };
    return iconos[categoria] || Flower2;
  };

  // Colores hawaianos más vibrantes
  const getColorCategoria = (categoria) => {
    const colores = {
      'Postres Helados': 'from-cyan-400 via-sky-400 to-blue-500',
      'Crepas': 'from-orange-400 via-pink-400 to-rose-500',
      'Hot Cakes': 'from-amber-400 via-yellow-400 to-orange-500',
      'Salado': 'from-emerald-400 via-green-400 to-teal-500',
      'Biónicos': 'from-pink-400 via-fuchsia-400 to-purple-500',
      'Bebidas': 'from-blue-400 via-indigo-400 to-purple-500',
      'Mini Donas': 'from-purple-400 via-pink-400 to-rose-500',
      'Waffles': 'from-indigo-400 via-purple-400 to-pink-500',
      'Fresas con Crema': 'from-red-400 via-pink-400 to-rose-500',
      'Duraznos con Crema': 'from-orange-400 via-amber-400 to-yellow-500'
    };
    return colores[categoria] || 'from-pink-400 via-orange-400 to-yellow-500';
  };

  const obtenerToppingsPermitidos = (categoria) => {
    const categoriasConToppings = ['Crepas', 'Hot Cakes', 'Mini Donas', 'Waffles', 'Biónicos'];
    return categoriasConToppings.includes(categoria);
  };

  // Filtrado mejorado - CORRIGIENDO DEFINITIVAMENTE
  const productosFiltrados = productos.filter(producto => {
    // Mostrar SOLO productos activos (activo = 1 o activo = true)
    console.log('Producto:', producto.nombre, 'Activo:', producto.activo, 'Tipo:', typeof producto.activo);
    if (!producto.activo || producto.activo === 0 || producto.activo === false) {
      return false;
    }
    
    const coincideCategoria = categoriaSeleccionada === 'Todas' || producto.categoria === categoriaSeleccionada;
    const coincideBusqueda = busqueda === '' || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    
    return coincideCategoria && coincideBusqueda;
  });

  const abrirModalProducto = (producto) => {
    setProductoSeleccionado(producto);
    setOpcionesSeleccionadas([]);
    setToppingsSeleccionados([]);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoSeleccionado(null);
    setOpcionesSeleccionadas([]);
    setToppingsSeleccionados([]);
  };

  const toggleOpcion = (opcion) => {
    setOpcionesSeleccionadas(prev => {
      const existe = prev.find(o => o.id === opcion.id);
      if (existe) {
        return prev.filter(o => o.id !== opcion.id);
      } else {
        return [...prev, opcion];
      }
    });
  };

  const toggleTopping = (topping) => {
    setToppingsSeleccionados(prev => {
      const existe = prev.find(t => t.id === topping.id);
      if (existe) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        // Limitar toppings gratis a 3
        const toppingsGratisActuales = prev.filter(t => t.precio === 0).length;
        if (topping.precio === 0 && toppingsGratisActuales >= 3) {
          mostrarNotificacion('Máximo 3 toppings gratis por producto', 'warning');
          return prev;
        }
        return [...prev, topping];
      }
    });
  };

  const calcularPrecioTotal = () => {
    if (!productoSeleccionado) return 0;
    
    let precio = productoSeleccionado.precio;
    precio += opcionesSeleccionadas.reduce((sum, op) => sum + op.precio, 0);
    precio += toppingsSeleccionados.reduce((sum, top) => sum + top.precio, 0);
    
    return precio;
  };

  const agregarAlCarrito = () => {
    const item = {
      id: Date.now(),
      producto_id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      precio: calcularPrecioTotal(),
      cantidad: 1,
      opciones: opcionesSeleccionadas,
      toppings: toppingsSeleccionados
    };

    setCarrito(prev => [...prev, item]);
    cerrarModal();
    mostrarNotificacion('¡Producto agregado al carrito! 🛒', 'success');
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
    mostrarNotificacion('Producto eliminado del carrito', 'info');
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    setCarrito(prev => prev.map(item => 
      item.id === id ? { ...item, cantidad: nuevaCantidad } : item
    ));
  };

  const calcularTotalCarrito = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const abrirCobro = () => {
    if (carrito.length === 0) {
      mostrarNotificacion('El carrito está vacío', 'warning');
      return;
    }
    setMontoPago('');
    setMostrarCobro(true);
  };

  const procesarVenta = async (pagoCliente) => {
    try {
      const venta = {
        items: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          opciones: item.opciones,
          toppings: item.toppings,
          nombre: item.nombre
        })),
        total: calcularTotalCarrito()
      };

      const response = await fetch(`${API_BASE_URL}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venta),
      });

      if (response.ok) {
        const result = await response.json();
        mostrarNotificacion('¡Venta procesada exitosamente!', 'success');

        // Mostrar ticket para imprimir con info de pago
        setTicketParaImprimir({
          id: result.id,
          items: carrito,
          total: calcularTotalCarrito(),
          pago: pagoCliente,
          cambio: pagoCliente - calcularTotalCarrito()
        });

        setCarrito([]);
        setCarritoAbierto(false);
        setMostrarCobro(false);
        setMontoPago('');
        cargarVentas();
        cargarEstadisticas();
      } else {
        throw new Error('Error al procesar venta');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al procesar la venta', 'error');
    }
  };

  const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos-cocina/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        cargarPedidosCocina();
        mostrarNotificacion(`Pedido ${nuevoEstado}`, 'success');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      mostrarNotificacion('Error al actualizar estado', 'error');
    }
  };

  const crearProducto = async (datosProducto) => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosProducto),
      });

      if (response.ok) {
        mostrarNotificacion('Producto creado exitosamente', 'success');
        cargarProductos(true);
        setMostrarFormularioProducto(false);
      } else {
        const error = await response.json();
        mostrarNotificacion(`Error: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al crear producto', 'error');
    }
  };

  const actualizarProducto = async (id, datosProducto) => {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosProducto),
      });

      if (response.ok) {
        mostrarNotificacion('Producto actualizado exitosamente', 'success');
        cargarProductos(true);
        setProductoEditando(null);
      } else {
        throw new Error('Error al actualizar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al actualizar producto', 'error');
    }
  };

  const eliminarProducto = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          mostrarNotificacion('Producto eliminado exitosamente', 'success');
          cargarProductos(true);
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar producto', 'error');
      }
    }
  };

  // Componente Loading Screen
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-400 via-orange-400 to-yellow-500 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 animate-pulse">
            <Palmtree size={64} className="text-white animate-bounce" />
          </div>
          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full animate-ping opacity-20"></div>
        </div>
        <h1 className="text-6xl font-black text-white mb-4 drop-shadow-lg">Hawaii Snacks</h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
        <p className="text-white/80 text-xl font-bold mt-4">Preparando tu experiencia tropical...</p>
      </div>
    </div>
  );

  // Componente del formulario de producto COMPLETAMENTE CORREGIDO
  const FormularioProducto = ({ producto, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      nombre: producto?.nombre || '',
      precio: producto?.precio || '',
      categoria: producto?.categoria || '',
      descripcion: producto?.descripcion || ''
    });

    const handleSubmit = () => {
      if (!formData.nombre || !formData.precio || !formData.categoria) {
        mostrarNotificacion('Por favor completa todos los campos requeridos', 'warning');
        return;
      }
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[70] overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/30 my-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-pink-500 via-orange-500 to-yellow-500 rounded-2xl shadow-2xl">
                <Package className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  {producto ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <p className="text-gray-600 text-sm font-medium">Gestiona tu catálogo hawaiano</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Nombre del Producto *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all bg-white text-lg font-medium placeholder-gray-400"
                  placeholder="Ej: Crepa Tropical Deluxe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Precio *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                    className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all bg-white text-lg font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Categoría *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all bg-white text-lg font-medium"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.filter(c => c !== 'Todas').map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all resize-none bg-white text-lg font-medium placeholder-gray-400"
                  rows="4"
                  placeholder="Describe tu delicioso producto hawaiano..."
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-bold text-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 text-white rounded-2xl hover:from-pink-600 hover:via-orange-600 hover:to-yellow-600 transition-all shadow-2xl font-black text-lg"
                >
                  {producto ? 'Actualizar' : 'Crear Producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de estadísticas mejorado
  const TarjetaEstadistica = ({ icono: Icono, titulo, valor, color, descripcion, delay = 0 }) => (
    <div 
      className={`bg-gradient-to-br ${color} rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 relative overflow-hidden group animate-in slide-in-from-bottom-4 fade-in`}
      style={{animationDelay: `${delay}ms`}}
    >
      {/* Efecto de ondas */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full transform -translate-x-4 translate-y-4"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Icono size={32} className="text-white drop-shadow-lg" />
          </div>
          <div className="text-right">
            <p className="text-white/90 text-sm font-bold mb-1 uppercase tracking-wider">{titulo}</p>
            <p className="text-4xl font-black text-white drop-shadow-lg">{valor}</p>
            {descripcion && <p className="text-white/80 text-sm font-medium">{descripcion}</p>}
          </div>
        </div>
      </div>
      
      {/* Efecto de brillo al hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="fixed top-10 right-10 w-32 h-32 bg-gradient-to-r from-pink-300/20 to-orange-300/20 rounded-full blur-3xl"></div>
      <div className="fixed bottom-10 left-10 w-24 h-24 bg-gradient-to-r from-yellow-300/20 to-pink-300/20 rounded-full blur-2xl"></div>
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-orange-200/10 to-pink-200/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>

      {/* Header súper premium */}
      <header className="bg-white/80 backdrop-blur-2xl shadow-2xl border-b border-white/30 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-24">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="relative group">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-400 via-orange-500 to-yellow-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Sparkles size={20} className="sm:hidden text-white animate-pulse" />
                    <Sparkles size={32} className="hidden sm:block text-white animate-pulse" />
                  </div>
                  <div className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-xl ${socketConectado ? 'bg-green-500' : 'bg-red-500'}`}>
                    {socketConectado ? <Wifi size={10} className="sm:hidden text-white" /> : <WifiOff size={10} className="sm:hidden text-white" />}
                    {socketConectado ? <Wifi size={14} className="hidden sm:block text-white" /> : <WifiOff size={14} className="hidden sm:block text-white" />}
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-3xl font-black bg-gradient-to-r from-pink-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                    Hawaii Snacks
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm font-bold hidden sm:block">Sistema POS Tropical Premium</p>
                </div>
              </div>
            </div>

            {/* Botón carrito móvil */}
            {vista === 'ventas' && (
              <button
                onClick={() => setCarritoAbierto(!carritoAbierto)}
                className="lg:hidden relative p-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl text-white shadow-lg"
              >
                <ShoppingCart size={24} />
                {carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </button>
            )}

            <nav className="hidden sm:flex space-x-2 sm:space-x-3">
              {[
                { id: 'ventas', icon: ShoppingCart, label: 'Ventas', color: 'from-blue-500 to-cyan-600', emoji: '🛒', bg: 'bg-blue-50' },
                { id: 'cocina', icon: ChefHat, label: 'Cocina', color: 'from-green-500 to-emerald-600', emoji: '👨‍🍳', bg: 'bg-green-50' },
                { id: 'admin', icon: User, label: 'Admin', color: 'from-purple-500 to-indigo-600', emoji: '⚙️', bg: 'bg-purple-50' },
                { id: 'reportes', icon: BarChart3, label: 'Reportes', color: 'from-indigo-500 to-purple-600', emoji: '📊', bg: 'bg-indigo-50' }
              ].map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setVista(item.id)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 transform hover:scale-105 relative overflow-hidden group ${
                    vista === item.id
                      ? `bg-gradient-to-r ${item.color} text-white shadow-2xl`
                      : `text-gray-700 hover:text-gray-900 ${item.bg} hover:shadow-xl backdrop-blur-sm border border-white/50`
                  }`}
                >
                  {vista !== item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  )}
                  <item.icon size={18} className="relative z-10" />
                  <span className="hidden md:block relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Navegación móvil */}
          <nav className="sm:hidden flex justify-around py-2 border-t border-gray-200/50">
            {[
              { id: 'ventas', icon: ShoppingCart, label: 'Ventas', color: 'from-blue-500 to-cyan-600' },
              { id: 'cocina', icon: ChefHat, label: 'Cocina', color: 'from-green-500 to-emerald-600' },
              { id: 'admin', icon: User, label: 'Admin', color: 'from-purple-500 to-indigo-600' },
              { id: 'reportes', icon: BarChart3, label: 'Reportes', color: 'from-indigo-500 to-purple-600' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setVista(item.id)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  vista === item.id
                    ? `bg-gradient-to-r ${item.color} text-white`
                    : 'text-gray-600'
                }`}
              >
                <item.icon size={20} />
                <span className="text-xs mt-1 font-bold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Vista de Ventas rediseñada */}
      {vista === 'ventas' && (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <div className="flex gap-4 lg:gap-10">
            {/* Panel de productos */}
            <div className="flex-1 min-w-0">
              {/* Header épico */}
              <div className="mb-4 sm:mb-10 animate-in slide-in-from-left-4 fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-5xl font-black bg-gradient-to-r from-pink-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-1 sm:mb-3">
                      Menú Tropical
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-xl font-medium">Descubre nuestros sabores únicos</p>
                  </div>
                  <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="flex items-center justify-center space-x-2 sm:space-x-4 px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl font-bold text-sm sm:text-base"
                  >
                    <Filter size={18} />
                    <span>Filtros</span>
                  </button>
                </div>

                {/* Barra de búsqueda espectacular */}
                <div className="relative mb-4 sm:mb-8 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 rounded-2xl sm:rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-1 sm:p-2 shadow-2xl border border-white/50">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-4 ml-1 sm:ml-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg sm:rounded-xl">
                          <Search className="text-white" size={18} />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 p-2 sm:p-4 bg-transparent outline-none text-base sm:text-xl font-medium placeholder-gray-400 text-gray-800"
                      />
                      {busqueda && (
                        <button
                          onClick={() => setBusqueda('')}
                          className="p-2 mr-2 sm:mr-4 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <X className="text-gray-400" size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filtros de categoría increíbles */}
                {mostrarFiltros && (
                  <div className="mb-10 p-8 bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
                      <Waves className="mr-3 text-blue-500" size={28} />
                      Categorías del Paraíso
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                      {categorias.map((categoria, index) => {
                        const IconoCategoria = getIconoCategoria(categoria);
                        const colorCategoria = getColorCategoria(categoria);
                        return (
                          <button
                            key={categoria}
                            onClick={() => setCategoriaSeleccionada(categoria)}
                            className={`group flex flex-col items-center space-y-3 p-6 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
                              categoriaSeleccionada === categoria
                                ? `bg-gradient-to-br ${colorCategoria} text-white shadow-2xl`
                                : 'bg-white/60 text-gray-700 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:shadow-xl'
                            }`}
                            style={{animationDelay: `${index * 50}ms`}}
                          >
                            <div className={`p-3 rounded-xl transition-all duration-300 ${
                              categoriaSeleccionada === categoria 
                                ? 'bg-white/20 backdrop-blur-sm' 
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <IconoCategoria size={24} className={
                                categoriaSeleccionada === categoria ? 'text-white' : 'text-gray-600'
                              } />
                            </div>
                            <span className="text-center leading-tight">{categoria}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid de productos espectacular */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                {productosFiltrados.map((producto, index) => {
                  const IconoCategoria = getIconoCategoria(producto.categoria);
                  const colorCategoria = getColorCategoria(producto.categoria);
                  return (
                    <div
                      key={producto.id}
                      className="group cursor-pointer animate-in slide-in-from-bottom-4 fade-in duration-500"
                      style={{animationDelay: `${Math.min(index, 8) * 50}ms`}}
                      onClick={() => abrirModalProducto(producto)}
                    >
                      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-3 hover:scale-[1.02] sm:hover:scale-105 overflow-hidden group-hover:bg-white">
                        {/* Header del producto con animación */}
                        <div className={`h-16 sm:h-24 bg-gradient-to-r ${colorCategoria} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative p-3 sm:p-6 flex justify-between items-center h-full">
                            <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center">
                              <IconoCategoria className="text-white drop-shadow-lg" size={16} />
                            </div>
                            <div className="text-right">
                              <div className="text-xl sm:text-3xl font-black text-white drop-shadow-lg">${producto.precio}</div>
                            </div>
                          </div>
                        </div>

                        {/* Contenido del producto */}
                        <div className="p-3 sm:p-6">
                          <h3 className="font-black text-gray-900 text-sm sm:text-xl mb-2 sm:mb-4 leading-tight line-clamp-2">
                            {producto.nombre}
                          </h3>

                          {producto.descripcion && (
                            <p className="hidden sm:block text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                              {producto.descripcion}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {producto.opciones && producto.opciones.length > 0 && (
                                <span className="text-[10px] sm:text-xs text-blue-600 bg-blue-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold">
                                  Opc
                                </span>
                              )}
                              {producto.toppings && producto.toppings.length > 0 && (
                                <span className="text-[10px] sm:text-xs text-green-600 bg-green-50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-bold">
                                  Top
                                </span>
                              )}
                            </div>
                            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                              <Plus className="text-white" size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {productosFiltrados.length === 0 && (
                <div className="text-center py-20 animate-in fade-in duration-500">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Package className="text-gray-400" size={64} />
                  </div>
                  <p className="text-gray-500 font-black text-2xl mb-3">🔍 No encontramos esa delicia</p>
                  <p className="text-gray-400 text-lg">Intenta con otros filtros de búsqueda mágicos</p>
                </div>
              )}
            </div>

            {/* Panel del carrito - Desktop fijo, Móvil lateral */}
            <div className={`
              fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto
              w-full sm:w-96 lg:w-96
              transform transition-transform duration-300 ease-in-out
              ${carritoAbierto ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              {/* Overlay para móvil */}
              {carritoAbierto && (
                <div
                  className="fixed inset-0 bg-black/50 lg:hidden -z-10"
                  onClick={() => setCarritoAbierto(false)}
                />
              )}

              <div className="h-full lg:sticky lg:top-32 animate-in slide-in-from-right-4 fade-in duration-700">
                <div className="bg-white/95 lg:bg-white/90 backdrop-blur-2xl lg:rounded-3xl shadow-2xl border-l lg:border border-white/50 overflow-hidden h-full lg:h-auto flex flex-col">
                  {/* Header del carrito súper estilizado */}
                  <div className="bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 p-4 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-6 translate-y-6"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Botón cerrar en móvil */}
                        <button
                          onClick={() => setCarritoAbierto(false)}
                          className="lg:hidden w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"
                        >
                          <X className="text-white" size={20} />
                        </button>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                          <ShoppingCart className="text-white" size={24} />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg">Mi Carrito</h2>
                          <p className="text-white/90 text-xs sm:text-sm font-bold">{carrito.length} productos</p>
                        </div>
                      </div>
                      {carrito.length > 0 && (
                        <button
                          onClick={() => setCarrito([])}
                          className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
                        >
                          <Trash2 className="text-white" size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Contenido del carrito */}
                  <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
                    {carrito.length === 0 ? (
                      <div className="text-center py-10 sm:py-16">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                          <ShoppingCart className="text-gray-300" size={40} />
                        </div>
                        <p className="text-gray-500 font-black text-lg sm:text-xl mb-2 sm:mb-3">Carrito Vacío</p>
                        <p className="text-gray-400 text-sm sm:text-lg">Agrega productos del menú</p>
                      </div>
                    ) : (
                      <div>
                        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                          {carrito.map(item => (
                            <div key={item.id} className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200/50">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-sm flex-1 pr-2">
                                  {item.nombre}
                                </h4>
                                <button
                                  onClick={() => eliminarDelCarrito(item.id)}
                                  className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="text-red-500" size={14} />
                                </button>
                              </div>
                              
                              {item.opciones.length > 0 && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg mb-2 inline-block">
                                  {item.opciones.map(o => o.nombre).join(', ')}
                                </div>
                              )}
                              {item.toppings.length > 0 && (
                                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg mb-3 inline-block ml-2">
                                  {item.toppings.map(t => t.nombre).join(', ')}
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                                    className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl flex items-center justify-center hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg"
                                  >
                                    <Minus className="text-white" size={14} />
                                  </button>
                                  <span className="font-black text-lg w-8 text-center">{item.cantidad}</span>
                                  <button
                                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                                    className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl flex items-center justify-center hover:from-orange-500 hover:to-pink-600 transition-all shadow-lg"
                                  >
                                    <Plus className="text-white" size={14} />
                                  </button>
                                </div>
                                <span className="font-black text-gray-900 text-lg">
                                  ${(item.precio * item.cantidad).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Total y botón de pago */}
                        <div className="border-t border-gray-200 pt-4 sm:pt-6">
                          <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <span className="text-lg sm:text-xl font-black text-gray-900">Total:</span>
                            <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                              ${calcularTotalCarrito().toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={abrirCobro}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                          >
                            Cobrar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Cocina rediseñada */}
      {vista === 'cocina' && (
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-10 animate-in slide-in-from-top-4 fade-in duration-500">
            <div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 bg-clip-text text-transparent mb-3">
                👨‍🍳 Cocina Tropical
              </h2>
              <p className="text-gray-600 text-xl font-medium">Centro de comando culinario hawaiano</p>
            </div>
            <button
              className="flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-1 hover:scale-105 font-bold"
              onClick={() => mostrarNotificacion('Pedidos actualizados', 'info')}
            >
              <RefreshCw size={22} />
              <span>Actualizar Estado</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pedidosCocina.map((pedido, index) => {
              let items = [];
              try {
                items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
              } catch (error) {
                items = [];
              }
              
              const getEstadoConfig = (estado) => {
                const configs = {
                  'completado': {
                    color: 'from-green-400 to-emerald-500',
                    bg: 'bg-green-50',
                    border: 'border-green-400',
                    text: 'text-green-800',
                    badgeBg: 'bg-green-100',
                    label: '✅ Completado',
                    emoji: '🎉'
                  },
                  'en_preparacion': {
                    color: 'from-yellow-400 to-orange-500',
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-400',
                    text: 'text-yellow-800',
                    badgeBg: 'bg-yellow-100',
                    label: '⏳ En Preparación',
                    emoji: '🔥'
                  },
                  'pendiente': {
                    color: 'from-red-400 to-pink-500',
                    bg: 'bg-red-50',
                    border: 'border-red-400',
                    text: 'text-red-800',
                    badgeBg: 'bg-red-100',
                    label: '🆘 Pendiente',
                    emoji: '⚡'
                  }
                };
                return configs[estado] || configs['pendiente'];
              };

              const estadoConfig = getEstadoConfig(pedido.estado);
              
              return (
                <div
                  key={pedido.id}
                  className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-l-8 ${estadoConfig.border} ${estadoConfig.bg}/30 p-8 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-3xl group animate-in slide-in-from-bottom-4 fade-in`}
                  style={{animationDelay: `${index * 150}ms`}}
                >
                  {/* Header del pedido */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-black text-2xl text-gray-900 mb-2 flex items-center">
                        🍽️ Pedido #{pedido.id}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full inline-block">
                        {new Date(pedido.fecha_creacion).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-6 py-3 rounded-2xl text-sm font-black ${estadoConfig.badgeBg} ${estadoConfig.text} shadow-lg border border-white/50`}>
                      {estadoConfig.label}
                    </span>
                  </div>
                  
                  {/* Items del pedido */}
                  <div className="space-y-4 mb-8">
                    {items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                        <div className="font-black text-gray-900 mb-3 text-lg flex items-center">
                          <span className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            {item.cantidad}
                          </span>
                          🍴 {item.nombre}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Botones de acción épicos */}
                  {pedido.estado !== 'completado' && (
                    <div className="flex space-x-4">
                      {pedido.estado === 'pendiente' && (
                        <button
                          onClick={() => actualizarEstadoPedido(pedido.id, 'en_preparacion')}
                          className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 px-6 rounded-2xl text-sm font-black hover:from-yellow-500 hover:to-orange-600 transition-all shadow-xl hover:shadow-yellow-500/25 transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center"
                        >
                          <Clock size={20} className="mr-2" />
                          🔥 Iniciar Preparación
                        </button>
                      )}
                      <button
                        onClick={() => actualizarEstadoPedido(pedido.id, 'completado')}
                        className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 px-6 rounded-2xl text-sm font-black hover:from-green-500 hover:to-emerald-600 transition-all shadow-xl hover:shadow-green-500/25 transform hover:-translate-y-1 hover:scale-105 flex items-center justify-center"
                      >
                        <CheckCircle size={20} className="mr-2" />
                        ✅ Marcar Listo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pedidosCocina.length === 0 && (
            <div className="text-center py-20 animate-in fade-in duration-500">
              <div className="w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <ChefHat className="text-green-400" size={80} />
              </div>
              <p className="text-gray-500 font-black text-3xl mb-4">🎉 ¡Cocina en Paz!</p>
              <p className="text-gray-400 text-xl">No hay pedidos pendientes por preparar</p>
            </div>
          )}
        </div>
      )}

      {/* Vista de Admin rediseñada */}
      {vista === 'admin' && (
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-10 animate-in slide-in-from-top-4 fade-in duration-500">
            <div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 bg-clip-text text-transparent mb-3">
                ⚙️ Centro de Control
              </h2>
              <p className="text-gray-600 text-xl font-medium">Administración inteligente del paraíso tropical</p>
            </div>
            <button
              onClick={() => setMostrarFormularioProducto(true)}
              className="flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 text-white rounded-2xl hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 transition-all shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-1 hover:scale-105 font-bold"
            >
              <Plus size={22} />
              <span>✨ Crear Producto Mágico</span>
            </button>
          </div>

          {/* Tabla épica de productos */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-700">
            <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 px-10 py-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full transform translate-x-12 -translate-y-12"></div>
              <div className="relative">
                <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">📦 Catálogo Tropical</h3>
                <p className="text-white/90 font-bold text-lg">Gestiona tu inventario del paraíso</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    {['Producto Estrella', 'Categoría Paradise', 'Precio Premium', 'Estado Mágico', 'Acciones Épicas'].map((header, index) => (
                      <th key={header} className="px-8 py-6 text-left text-sm font-black text-gray-700 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white/80 divide-y divide-gray-200/50">
                  {productos.map((producto, index) => (
                    <tr 
                      key={producto.id} 
                      className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 transition-all duration-300 animate-in slide-in-from-left-4 fade-in"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <td className="px-8 py-8">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                            <Package className="text-white" size={24} />
                          </div>
                          <div>
                            <div className="text-xl font-black text-gray-900">{producto.nombre}</div>
                            {producto.descripcion && (
                              <div className="text-sm text-gray-600 max-w-xs truncate bg-gray-50 px-3 py-1 rounded-lg mt-1">
                                {producto.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-8">
                        <span className="px-4 py-2 text-sm font-bold rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200">
                          {producto.categoria}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ${producto.precio}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`px-4 py-2 text-sm font-black rounded-2xl border ${
                          producto.activo 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
                            : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'
                        }`}>
                          {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setProductoEditando(producto)}
                            className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-500 text-white rounded-xl hover:from-indigo-500 hover:to-purple-600 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center transform hover:-translate-y-1 hover:scale-110"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => mostrarNotificacion('Producto eliminado', 'success')}
                            className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-xl hover:from-red-500 hover:to-pink-600 transition-all shadow-lg hover:shadow-red-500/25 flex items-center justify-center transform hover:-translate-y-1 hover:scale-110"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Reportes rediseñada */}
      {vista === 'reportes' && (
        <div className="max-w-8xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-10 animate-in slide-in-from-top-4 fade-in duration-500">
            <div>
              <h2 className="text-5xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 bg-clip-text text-transparent mb-3">
                📊 Analytics Tropicales
              </h2>
              <p className="text-gray-600 text-xl font-medium">Dashboard inteligente del paraíso de datos</p>
            </div>
            <button
              className="flex items-center space-x-4 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 text-white rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-700 transition-all shadow-2xl hover:shadow-indigo-500/25 transform hover:-translate-y-1 hover:scale-105 font-bold"
              onClick={() => mostrarNotificacion('Estadísticas actualizadas', 'info')}
            >
              <RefreshCw size={22} />
              <span>Actualizar Analytics</span>
            </button>
          </div>

          {/* Tarjetas de estadísticas súper premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <TarjetaEstadistica
              icono={DollarSign}
              titulo="💰 Ventas del Día"
              valor={`${estadisticas.ventasHoy?.total?.toFixed(2) || '0.00'}`}
              color="from-emerald-400 via-green-500 to-teal-600"
              descripcion={`${estadisticas.ventasHoy?.count || 0} transacciones exitosas`}
              delay={0}
            />
            <TarjetaEstadistica
              icono={ShoppingCart}
              titulo="🛒 Pedidos Procesados"
              valor={estadisticas.ventasHoy?.count || 0}
              color="from-blue-400 via-cyan-500 to-indigo-600"
              descripcion="Órdenes del paraíso"
              delay={100}
            />
            <TarjetaEstadistica
              icono={Package}
              titulo="📦 Productos Activos"
              valor={productos.filter(p => p.activo).length}
              color="from-purple-400 via-indigo-500 to-blue-600"
              descripcion="Catálogo tropical"
              delay={200}
            />
            <TarjetaEstadistica
              icono={Clock}
              titulo="⏳ En Preparación"
              valor={pedidosCocina.filter(p => p.estado !== 'completado').length}
              color="from-orange-400 via-red-500 to-pink-600"
              descripcion="Esperando en cocina"
              delay={300}
            />
          </div>

          {/* Sección de análisis detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Productos más vendidos */}
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-10 animate-in slide-in-from-left-4 fade-in duration-700">
              <h3 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                <Award className="mr-4 text-yellow-500" size={36} />
                🏆 Hall de la Fama
              </h3>
              <div className="space-y-6">
                {estadisticas.productosVendidos?.slice(0, 3).map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200/50 hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${
                        index === 0 ? 'from-yellow-400 to-orange-500' : 
                        index === 1 ? 'from-gray-300 to-gray-400' : 
                        'from-orange-400 to-red-500'
                      } rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-black text-xl">#{index + 1}</span>
                      </div>
                      <div>
                        <span className="font-black text-gray-900 text-xl">{producto.nombre}</span>
                        <p className="text-gray-600 font-medium">Producto estrella</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">{producto.cantidad}</span>
                      <p className="text-gray-600 text-sm font-bold">vendidos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del día */}
            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-10 animate-in slide-in-from-right-4 fade-in duration-700">
              <h3 className="text-3xl font-black text-gray-900 mb-8 flex items-center">
                <TrendingUp className="mr-4 text-green-500" size={36} />
                📈 Resumen Tropical
              </h3>
              {ventas.slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {ventas.slice(0, 5).map((venta, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-blue-800 text-lg">Venta #{venta.id}</h4>
                          <p className="text-blue-600 text-sm">{new Date(venta.fecha).toLocaleString()}</p>
                        </div>
                        <span className="text-2xl font-black text-blue-900">${venta.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                    <h4 className="font-black text-green-800 text-lg mb-2">Rendimiento del Día</h4>
                    <p className="text-green-600 font-bold">Excelente performance con ${estadisticas.ventasHoy?.total?.toFixed(2) || '0.00'} en ventas</p>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                    <h4 className="font-black text-blue-800 text-lg mb-2">Eficiencia Operativa</h4>
                    <p className="text-blue-600 font-bold">{estadisticas.ventasHoy?.count || 0} pedidos procesados</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sistema de notificaciones toast - AL FINAL para que aparezca */}
      <NotificacionesToast />

      {/* Modal de producto con z-index CORREGIDO */}
      {mostrarModal && productoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[65] overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-white/30 my-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`p-4 bg-gradient-to-br ${getColorCategoria(productoSeleccionado.categoria)} rounded-2xl shadow-2xl`}>
                    {React.createElement(getIconoCategoria(productoSeleccionado.categoria), { 
                      size: 32, 
                      className: "text-white" 
                    })}
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-1">
                      {productoSeleccionado.nombre}
                    </h3>
                    <p className="text-gray-600 text-lg font-medium">
                      {productoSeleccionado.categoria} • ${productoSeleccionado.precio}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarModal}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors"
                >
                  <X className="text-gray-500" size={24} />
                </button>
              </div>

              {productoSeleccionado.descripcion && (
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed">{productoSeleccionado.descripcion}</p>
                </div>
              )}

              {/* Opciones */}
              {productoSeleccionado.opciones && productoSeleccionado.opciones.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-2xl font-black text-gray-900 mb-4 flex items-center">
                    Opciones Disponibles
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productoSeleccionado.opciones.map(opcion => (
                      <button
                        key={opcion.id}
                        onClick={() => toggleOpcion(opcion)}
                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-left ${
                          opcionesSeleccionadas.find(o => o.id === opcion.id)
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 shadow-lg'
                            : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{opcion.nombre}</span>
                          {opcion.precio > 0 && (
                            <span className="text-sm">+${opcion.precio}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toppings */}
              {productoSeleccionado.toppings && productoSeleccionado.toppings.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-2xl font-black text-gray-900 mb-4 flex items-center">
                    Toppings Especiales
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productoSeleccionado.toppings.map(topping => (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-left ${
                          toppingsSeleccionados.find(t => t.id === topping.id)
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-600 shadow-lg'
                            : 'bg-white hover:bg-green-50 text-gray-700 border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{topping.nombre}</span>
                          {topping.precio > 0 ? (
                            <span className="text-sm font-black bg-yellow-400 text-yellow-900 px-2 py-1 rounded-lg">
                              +${topping.precio}
                            </span>
                          ) : (
                            <span className="text-sm text-green-600">Gratis</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen y total */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 border border-orange-200 mb-8">
                <h4 className="text-xl font-black text-gray-900 mb-4">Resumen de tu Pedido</h4>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Producto base:</span>
                    <span className="font-bold">${productoSeleccionado.precio}</span>
                  </div>
                  
                  {opcionesSeleccionadas.map(opcion => (
                    <div key={opcion.id} className="flex justify-between text-blue-600">
                      <span>+ {opcion.nombre}</span>
                      <span>${opcion.precio}</span>
                    </div>
                  ))}
                  
                  {toppingsSeleccionados.map(topping => (
                    <div key={topping.id} className="flex justify-between text-green-600">
                      <span>+ {topping.nombre}</span>
                      <span>${topping.precio}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-orange-300 pt-4 flex justify-between items-center">
                  <span className="text-2xl font-black text-gray-900">Total:</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    ${calcularPrecioTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={cerrarModal}
                  className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-bold text-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarAlCarrito}
                  className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-2xl hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-orange-500/25 transform hover:-translate-y-1 font-black text-lg"
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarFormularioProducto && (
        <FormularioProducto
          producto={productoEditando}
          onSubmit={(data) => {
            if (productoEditando) {
              actualizarProducto(productoEditando.id, data);
            } else {
              crearProducto(data);
            }
          }}
          onCancel={() => {
            setMostrarFormularioProducto(false);
            setProductoEditando(null);
          }}
        />
      )}

      {productoEditando && !mostrarFormularioProducto && (
        <FormularioProducto
          producto={productoEditando}
          onSubmit={(data) => {
            actualizarProducto(productoEditando.id, data);
          }}
          onCancel={() => setProductoEditando(null)}
        />
      )}

      {/* Modal de cobro */}
      {mostrarCobro && <ModalCobro />}

      {/* Modal de impresión de ticket */}
      {ticketParaImprimir && (
        <TicketImpresion
          venta={ticketParaImprimir}
          onClose={() => setTicketParaImprimir(null)}
        />
      )}
    </div>
  );
}

export default App;
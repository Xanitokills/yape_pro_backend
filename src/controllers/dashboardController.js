// src/controllers/dashboardController.js
const { supabase } = require('../config/database');

/**
 * Obtener estadísticas del dashboard
 * GET /api/dashboard/stats
 */
async function getDashboardStats(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Obtener la primera tienda del usuario (o todas si es admin)
    let storeId = req.query.store_id;
    
    if (!storeId) {
      // Si no se especifica tienda, obtener la primera del usuario
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        // Para workers, obtener tiendas donde trabaja
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              stats: {
                daily_sales: 0,
                daily_sales_change: 0,
                transactions: 0,
                transactions_change: 0,
                average_ticket: 0,
                average_ticket_change: 0,
                new_customers: 0,
                new_customers_change: 0
              }
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
      
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              stats: {
                daily_sales: 0,
                daily_sales_change: 0,
                transactions: 0,
                transactions_change: 0,
                average_ticket: 0,
                average_ticket_change: 0,
                new_customers: 0,
                new_customers_change: 0
              }
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Fechas para comparación
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Ventas del día de hoy
    const { data: todayNotifications } = await supabase
      .from('notifications')
      .select('amount, sender_name')
      .eq('store_id', storeId)
      .gte('notification_timestamp', today.toISOString());
    
    // Ventas de ayer
    const { data: yesterdayNotifications } = await supabase
      .from('notifications')
      .select('amount')
      .eq('store_id', storeId)
      .gte('notification_timestamp', yesterday.toISOString())
      .lt('notification_timestamp', today.toISOString());
    
    // Ventas de la última semana
    const { data: lastWeekNotifications } = await supabase
      .from('notifications')
      .select('amount, sender_name')
      .eq('store_id', storeId)
      .gte('notification_timestamp', lastWeek.toISOString());
    
    // Ventas de la semana anterior (para comparación)
    const { data: twoWeeksAgoNotifications } = await supabase
      .from('notifications')
      .select('amount')
      .eq('store_id', storeId)
      .gte('notification_timestamp', twoWeeksAgo.toISOString())
      .lt('notification_timestamp', lastWeek.toISOString());
    
    // Calcular ventas diarias
    const dailySales = todayNotifications?.reduce((sum, n) => sum + parseFloat(n.amount), 0) || 0;
    const yesterdaySales = yesterdayNotifications?.reduce((sum, n) => sum + parseFloat(n.amount), 0) || 0;
    const dailySalesChange = yesterdaySales > 0 
      ? ((dailySales - yesterdaySales) / yesterdaySales * 100).toFixed(1)
      : 0;
    
    // Calcular transacciones
    const transactions = todayNotifications?.length || 0;
    const yesterdayTransactions = yesterdayNotifications?.length || 0;
    const transactionsChange = yesterdayTransactions > 0
      ? ((transactions - yesterdayTransactions) / yesterdayTransactions * 100).toFixed(1)
      : 0;
    
    // Calcular ticket promedio
    const averageTicket = transactions > 0 ? dailySales / transactions : 0;
    const yesterdayAverageTicket = yesterdayTransactions > 0 
      ? yesterdaySales / yesterdayTransactions 
      : 0;
    const averageTicketChange = yesterdayAverageTicket > 0
      ? ((averageTicket - yesterdayAverageTicket) / yesterdayAverageTicket * 100).toFixed(1)
      : 0;
    
    // Calcular clientes nuevos (únicos por sender_name en la última semana)
    const lastWeekCustomers = new Set(
      lastWeekNotifications?.map(n => cleanSenderName(n.sender_name)).filter(name => name !== 'Cliente Anónimo')
    );
    const twoWeeksAgoCustomers = new Set(
      twoWeeksAgoNotifications?.map(n => cleanSenderName(n.sender_name)).filter(name => name !== 'Cliente Anónimo')
    );
    
    const newCustomers = lastWeekCustomers.size;
    const previousNewCustomers = twoWeeksAgoCustomers.size;
    const newCustomersChange = previousNewCustomers > 0
      ? ((newCustomers - previousNewCustomers) / previousNewCustomers * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        stats: {
          daily_sales: dailySales.toFixed(2),
          daily_sales_change: dailySalesChange,
          transactions: transactions,
          transactions_change: transactionsChange,
          average_ticket: averageTicket.toFixed(2),
          average_ticket_change: averageTicketChange,
          new_customers: newCustomers,
          new_customers_change: newCustomersChange
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: 'No se pudieron cargar las estadísticas del dashboard'
    });
  }
}

/**
 * Obtener transacciones recientes
 * GET /api/dashboard/recent-transactions
 */
async function getRecentTransactions(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const limit = parseInt(req.query.limit) || 5;
    
    // Obtener la primera tienda del usuario
    let storeId = req.query.store_id;
    
    if (!storeId) {
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              transactions: []
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
        
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              transactions: []
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Obtener transacciones recientes
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, amount, sender_name, source, notification_timestamp, processed')
      .eq('store_id', storeId)
      .order('notification_timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Formatear transacciones
    const transactions = notifications?.map(n => {
      const timeAgo = getTimeAgo(new Date(n.notification_timestamp));
      
      return {
        id: n.id,
        customer: cleanSenderName(n.sender_name),
        amount: parseFloat(n.amount).toFixed(2),
        time: timeAgo,
        status: n.processed ? 'completed' : 'pending',
        source: n.source
      };
    }) || [];
    
    res.json({
      success: true,
      data: {
        transactions
      }
    });
    
  } catch (error) {
    console.error('Error en getRecentTransactions:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener transacciones',
      message: 'No se pudieron cargar las transacciones recientes'
    });
  }
}

/**
 * Obtener datos para el gráfico semanal
 * GET /api/dashboard/weekly-chart
 */
async function getWeeklyChart(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Obtener la primera tienda del usuario
    let storeId = req.query.store_id;
    
    if (!storeId) {
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              chart: Array(7).fill(0)
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
        
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              chart: Array(7).fill(0)
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Obtener ventas de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const { data: notifications } = await supabase
      .from('notifications')
      .select('amount, notification_timestamp')
      .eq('store_id', storeId)
      .gte('notification_timestamp', sevenDaysAgo.toISOString());
    
    // Agrupar por día
    const dailyData = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    notifications?.forEach(n => {
      const notifDate = new Date(n.notification_timestamp);
      notifDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - notifDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < 7) {
        dailyData[6 - daysDiff] += parseFloat(n.amount);
      }
    });
    
    res.json({
      success: true,
      data: {
        chart: dailyData.map(v => v.toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Error en getWeeklyChart:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener datos del gráfico',
      message: 'No se pudieron cargar los datos del gráfico'
    });
  }
}

// Helper para limpiar nombres de remitentes
function cleanSenderName(senderName) {
  if (!senderName) return 'Cliente Anónimo';
  
  let cleanName = senderName.trim();
  
  // Eliminar texto de confirmación y prefijos
  const patterns = [
    /^(?:confirmación de pago\s+)?yape!?\s*/i,
    /^(?:confirmación de\s+)?plin!?\s*/i,
    /^pago recibido\s+/i,
    /^recibiste\s+.*?de\s+/i,
    /\s+te\s+envió\s+un\s+pago.*$/i,  // Eliminar texto al final
  ];
  
  for (const pattern of patterns) {
    cleanName = cleanName.replace(pattern, '');
  }
  
  // Convertir a formato título (Primera Letra Mayúscula)
  cleanName = cleanName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleanName.trim() || 'Cliente Anónimo';
}

// Helper para calcular tiempo transcurrido
function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // diferencia en segundos
  
  if (diff < 60) return 'Hace menos de 1 min';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `Hace ${mins} min`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.floor(diff / 86400);
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

/**
 * Obtener estadísticas de reportes (últimos 30 días)
 * GET /api/dashboard/reports-stats
 */
async function getReportsStats(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const days = parseInt(req.query.days) || 30;
    
    // Obtener tienda
    let storeId = req.query.store_id;
    
    if (!storeId) {
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              stats: {
                total_income: 0,
                total_income_change: 0,
                total_transactions: 0,
                total_transactions_change: 0,
                average_ticket: 0,
                average_ticket_change: 0,
                new_customers: 0,
                new_customers_change: 0
              }
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
        
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              stats: {
                total_income: 0,
                total_income_change: 0,
                total_transactions: 0,
                total_transactions_change: 0,
                average_ticket: 0,
                average_ticket_change: 0,
                new_customers: 0,
                new_customers_change: 0
              }
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Fechas para el período actual y anterior
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    // Obtener datos del período actual
    const { data: currentPeriodData } = await supabase
      .from('notifications')
      .select('amount, sender_name')
      .eq('store_id', storeId)
      .gte('notification_timestamp', startDate.toISOString());
    
    // Obtener datos del período anterior
    const { data: previousPeriodData } = await supabase
      .from('notifications')
      .select('amount, sender_name')
      .eq('store_id', storeId)
      .gte('notification_timestamp', previousStartDate.toISOString())
      .lt('notification_timestamp', startDate.toISOString());
    
    // Calcular estadísticas
    const totalIncome = currentPeriodData?.reduce((sum, n) => sum + parseFloat(n.amount), 0) || 0;
    const previousIncome = previousPeriodData?.reduce((sum, n) => sum + parseFloat(n.amount), 0) || 0;
    const incomeChange = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome * 100).toFixed(1)
      : 0;
    
    const totalTransactions = currentPeriodData?.length || 0;
    const previousTransactions = previousPeriodData?.length || 0;
    const transactionsChange = previousTransactions > 0
      ? ((totalTransactions - previousTransactions) / previousTransactions * 100).toFixed(1)
      : 0;
    
    const averageTicket = totalTransactions > 0 ? totalIncome / totalTransactions : 0;
    const previousAverageTicket = previousTransactions > 0 
      ? previousIncome / previousTransactions 
      : 0;
    const averageTicketChange = previousAverageTicket > 0
      ? ((averageTicket - previousAverageTicket) / previousAverageTicket * 100).toFixed(1)
      : 0;
    
    const currentCustomers = new Set(
      currentPeriodData?.map(n => cleanSenderName(n.sender_name)).filter(name => name !== 'Cliente Anónimo')
    );
    const previousCustomers = new Set(
      previousPeriodData?.map(n => cleanSenderName(n.sender_name)).filter(name => name !== 'Cliente Anónimo')
    );
    
    const newCustomers = currentCustomers.size;
    const previousNewCustomers = previousCustomers.size;
    const newCustomersChange = previousNewCustomers > 0
      ? ((newCustomers - previousNewCustomers) / previousNewCustomers * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        stats: {
          total_income: totalIncome.toFixed(2),
          total_income_change: incomeChange,
          total_transactions: totalTransactions,
          total_transactions_change: transactionsChange,
          average_ticket: averageTicket.toFixed(2),
          average_ticket_change: averageTicketChange,
          new_customers: newCustomers,
          new_customers_change: newCustomersChange
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getReportsStats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de reportes',
      message: 'No se pudieron cargar las estadísticas'
    });
  }
}

/**
 * Obtener datos de métodos de pago
 * GET /api/dashboard/payment-methods
 */
async function getPaymentMethods(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const days = parseInt(req.query.days) || 30;
    
    // Obtener tienda
    let storeId = req.query.store_id;
    
    if (!storeId) {
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              methods: []
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
        
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              methods: []
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Obtener datos del período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: notifications } = await supabase
      .from('notifications')
      .select('source, amount')
      .eq('store_id', storeId)
      .gte('notification_timestamp', startDate.toISOString());
    
    // Agrupar por método de pago
    const methodStats = {};
    let total = 0;
    
    notifications?.forEach(n => {
      const source = n.source || 'other';
      const amount = parseFloat(n.amount);
      
      if (!methodStats[source]) {
        methodStats[source] = { count: 0, amount: 0 };
      }
      
      methodStats[source].count++;
      methodStats[source].amount += amount;
      total += amount;
    });
    
    // Formatear resultados
    const methods = Object.entries(methodStats).map(([source, data]) => ({
      method: source.charAt(0).toUpperCase() + source.slice(1),
      percentage: total > 0 ? ((data.amount / total) * 100).toFixed(1) : 0,
      count: data.count,
      amount: data.amount.toFixed(2)
    })).sort((a, b) => b.amount - a.amount);
    
    res.json({
      success: true,
      data: {
        methods
      }
    });
    
  } catch (error) {
    console.error('Error en getPaymentMethods:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métodos de pago',
      message: 'No se pudieron cargar los métodos de pago'
    });
  }
}

/**
 * Obtener datos de ventas diarias para gráfico
 * GET /api/dashboard/daily-sales
 */
async function getDailySales(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const days = parseInt(req.query.days) || 14;
    
    // Obtener tienda
    let storeId = req.query.store_id;
    
    if (!storeId) {
      let query = supabase.from('stores').select('id').limit(1);
      
      if (role === 'owner') {
        query = query.eq('owner_id', userId);
      } else if (role === 'worker') {
        const { data: workerStores } = await supabase
          .from('workers')
          .select('store_id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);
        
        if (!workerStores || workerStores.length === 0) {
          return res.json({
            success: true,
            data: {
              sales: Array(days).fill(0)
            }
          });
        }
        
        storeId = workerStores[0].store_id;
      }
      
      if (!storeId) {
        const { data: stores } = await query;
        
        if (!stores || stores.length === 0) {
          return res.json({
            success: true,
            data: {
              sales: Array(days).fill(0)
            }
          });
        }
        
        storeId = stores[0].id;
      }
    }
    
    // Obtener ventas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const { data: notifications } = await supabase
      .from('notifications')
      .select('amount, notification_timestamp')
      .eq('store_id', storeId)
      .gte('notification_timestamp', startDate.toISOString());
    
    // Agrupar por día
    const dailyData = Array(days).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    notifications?.forEach(n => {
      const notifDate = new Date(n.notification_timestamp);
      notifDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - notifDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < days) {
        dailyData[days - 1 - daysDiff] += parseFloat(n.amount);
      }
    });
    
    res.json({
      success: true,
      data: {
        sales: dailyData.map(v => v.toFixed(2))
      }
    });
    
  } catch (error) {
    console.error('Error en getDailySales:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ventas diarias',
      message: 'No se pudieron cargar las ventas diarias'
    });
  }
}

module.exports = {
  getDashboardStats,
  getRecentTransactions,
  getWeeklyChart,
  getReportsStats,
  getPaymentMethods,
  getDailySales
};

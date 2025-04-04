const ExcelJS = require('exceljs');

/**
 * Exports data to Excel format
 * @param {Array} data - The data to export
 * @param {String} type - The type of export (orders, revenue, products)
 * @returns {Promise<Buffer>} Excel file as buffer
 */
exports.exportToExcel = async (data, type) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'UberEat Analytics';
  workbook.lastModifiedBy = 'System';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  let worksheet;
  
  switch (type) {
    case 'orders':
      worksheet = workbook.addWorksheet('Orders');
      
      // Add headers
      worksheet.columns = [
        { header: 'Order ID', key: 'id', width: 10 },
        { header: 'Date', key: 'createdAt', width: 20 },
        { header: 'Customer', key: 'customerName', width: 20 },
        { header: 'Restaurant', key: 'restaurantName', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 }
      ];
      
      // Format the data
      const formattedOrderData = data.map(order => ({
        id: order.id,
        createdAt: new Date(order.createdAt).toLocaleString(),
        customerName: order.User ? order.User.name : 'Unknown',
        restaurantName: order.Restaurant ? order.Restaurant.name : 'Unknown',
        status: order.status,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod
      }));
      
      // Add rows
      worksheet.addRows(formattedOrderData);
      break;
      
    case 'revenue':
      worksheet = workbook.addWorksheet('Revenue');
      
      // Add headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Order Count', key: 'orderCount', width: 15 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
        { header: 'Average Order Value', key: 'averageOrderValue', width: 20 }
      ];
      
      // Format the data
      const formattedRevenueData = data.map(item => ({
        date: item.date,
        orderCount: item.orderCount,
        totalRevenue: parseFloat(item.totalRevenue).toFixed(2),
        averageOrderValue: parseFloat(item.averageOrderValue).toFixed(2)
      }));
      
      // Add rows
      worksheet.addRows(formattedRevenueData);
      break;
      
    case 'products':
      worksheet = workbook.addWorksheet('Product Performance');
      
      // Add headers
      worksheet.columns = [
        { header: 'Product ID', key: 'productId', width: 10 },
        { header: 'Product Name', key: 'productName', width: 30 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Quantity Sold', key: 'totalQuantity', width: 15 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 20 }
      ];
      
      // Format the data
      const formattedProductData = data.map(item => ({
        productId: item.productId,
        productName: item.Product.name,
        price: item.Product.price.toFixed(2),
        totalQuantity: item.totalQuantity,
        totalRevenue: parseFloat(item.totalRevenue).toFixed(2)
      }));
      
      // Add rows
      worksheet.addRows(formattedProductData);
      break;
      
    default:
      worksheet = workbook.addWorksheet('Analytics Data');
      
      // For any other type, use the keys from the first data item as headers
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        
        // Create columns from headers
        worksheet.columns = headers.map(header => ({
          header: header,
          key: header,
          width: 20
        }));
        
        // Add rows directly
        worksheet.addRows(data);
      }
  }
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Create a buffer to store the workbook
  return await workbook.xlsx.writeBuffer();
};
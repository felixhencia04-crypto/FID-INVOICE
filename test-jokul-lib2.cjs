const dokuLib = require('jokul-nodejs-library');

async function test() {
  let setupConfiguration = dokuLib.SetupConfiguration;
  setupConfiguration.environment = 'sandbox';
  setupConfiguration.client_id = 'BRN-0229-1783394866076';
  setupConfiguration.shared_key = 'WRONG_KEY';
  setupConfiguration.serverLocation = dokuLib.getServerLocation(setupConfiguration.environment);
  setupConfiguration.channel = 'doku';
  
  const payload = {
    order: {
      amount: 10000,
      invoice_number: 'INV-123456789'
    },
    payment: {
      payment_due_date: 60
    },
    customer: {
      name: "Tamu",
      email: "tamu@test.com"
    },
    additional_info: {}
  };

  try {
    let res = await dokuLib.generateDOKUVa(setupConfiguration, payload);
    console.log(res);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();

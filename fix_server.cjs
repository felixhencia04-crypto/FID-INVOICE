const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(
  `      // MOCK DOKU STATUS API
      if (tx.status === 'confirmed') {
        responseData = { transaction_status: 'success', payment_type: 'Doku', gross_amount: tx.amount };
        successFetch = true;
        break;
      } catch (err) {`,
  `      // MOCK DOKU STATUS API
      if (tx.status === 'confirmed') {
        responseData = { transaction_status: 'success', payment_type: 'Doku', gross_amount: tx.amount };
        successFetch = true;
        break;
      }
    } catch (err) {`
);

fs.writeFileSync('server.ts', serverContent);
console.log('Fixed server.ts');

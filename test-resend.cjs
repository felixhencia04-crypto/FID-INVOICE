const { Resend } = require('resend');
async function test() {
  const resend = new Resend('undefined');
  const { data, error } = await resend.emails.send({
    from: 'test@example.com',
    to: ['test@example.com'],
    subject: 'test',
    html: 'test'
  });
  console.log(error);
}
test();

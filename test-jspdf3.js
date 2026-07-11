import { jsPDF } from 'jspdf';
import { createCanvas } from 'canvas';
const canvas = createCanvas(100, 100);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 100, 100);
const jpegData = canvas.toDataURL('image/jpeg');
const doc = new jsPDF();
try {
  const props = doc.getImageProperties(jpegData);
  console.log(props.width, props.height);
} catch (e) {
  console.error("Error:", e.message);
}

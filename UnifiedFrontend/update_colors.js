const fs = require('fs');
const path = require('path');
const dir = './app';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
files.forEach(f => {
  let content = fs.readFileSync(path.join(dir, f), 'utf8');
  content = content.replace(/#00D1B2/g, '#FFC107');
  
  // also change primaryBtnText color to dark
  content = content.replace(/primaryBtnText: { color:'#fff'/g, "primaryBtnText: { color:'#000000'");
  content = content.replace(/addBtnText: { color:'#fff'/g, "addBtnText: { color:'#000000'");
  
  content = content.replace(/<Text style={{color:'#fff',fontWeight:'bold',marginLeft:8}}>Add/g, "<Text style={{color:'#000',fontWeight:'bold',marginLeft:8}}>Add");
  content = content.replace(/<Text style={{color:'#fff',fontWeight:'bold'}}>Save/g, "<Text style={{color:'#000',fontWeight:'bold'}}>Save");
  
  content = content.replace(/<Text style={{color:'#fff', fontWeight:'bold', marginLeft:6}}>BUS DETAILS/g, "<Text style={{color:'#000', fontWeight:'bold', marginLeft:6}}>BUS DETAILS");

  // In users.js: login button icons
  content = content.replace(/<Ionicons name="bus" size=\{48\} color="#FFC107"/g, '<Ionicons name="bus" size={48} color="#FFC107"');
  
  fs.writeFileSync(path.join(dir, f), content);
});
let colorsContent = fs.readFileSync('./constants/Colors.js', 'utf8');
colorsContent = colorsContent.replace(/#00D1B2/g, '#FFC107');
fs.writeFileSync('./constants/Colors.js', colorsContent);
console.log("Colors updated to Yellow (#FFC107)");

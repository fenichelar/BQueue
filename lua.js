const fs = require('fs');
const path = require('path');

let lua = {};
const files = fs.readdirSync(path.join(__dirname, 'lua'));
files.forEach(fileName => {
  const parsedFileName = path.parse(fileName);
  if (parsedFileName.ext === '.lua') {
    lua[parsedFileName.name] = fs.readFileSync(path.join(__dirname, 'lua', fileName)).toString();
  }
});

fs.writeFileSync(path.join(__dirname, 'lua.json'), JSON.stringify(lua));

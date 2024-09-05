const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Sirve archivos estáticos (como HTML, CSS, JS) desde la carpeta "public"
app.use(express.static(path.join(__dirname)));

// Ruta principal que sirve un archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
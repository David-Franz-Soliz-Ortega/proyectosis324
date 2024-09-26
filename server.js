const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs'); // Asegúrate de que esta línea esté presente
const multer = require('multer');
const path = require('path');
const app = express();


// Código para generar el hash
const password = '123456'; // La contraseña que deseas probar
const saltRounds = 10; // Asegúrate de usar el mismo número de rounds
const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hash generado:', hash); // Imprime el hash
// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Asegura que la carpeta 'public' sirva archivos estáticos

// Conectar a la base de datos SQLite
const db = new sqlite3.Database('./proyecto_final324.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Establecer un tiempo de espera
db.configure("busyTimeout", 10000); // 10 segundos

// consulta prueba
db.get('SELECT COUNT(*) as count FROM usuario', (err, row) => {
    if (err) {
        console.error('Error al consultar la base de datos:', err.message);
    } else {
        console.log('Número de usuarios:', row.count);
    }
});

// // Crear la tabla de usuario si no existe
// db.serialize(() => {
//     db.run(`CREATE TABLE IF NOT EXISTS usuario (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         ci TEXT,
//         usuario TEXT UNIQUE,
//         password TEXT,
//         email TEXT,
//         rol TEXT
//     )`, (err) => {
//         if (err) {
//             console.error('Error al crear la tabla:', err.message);
//         } else {
//             console.log('Tabla de usuario creada o ya existe.');

//             // Aquí es donde puedes pegar el código para actualizar las contraseñas
//             const users = [
//                 { ci: 1, usuario: 'Abel', password: '123456' },
//                 { ci: 2, usuario: 'David', password: '123456' },
//                 { ci: 3, usuario: 'Luis', password: '123456' },
//                 { ci: 4, usuario: 'Soliz', password: '123456' }
//             ];

//             users.forEach(user => {
//                 const passwordHash = bcrypt.hashSync(user.password, 10);
//                 db.run('UPDATE usuario SET password = ? WHERE ci = ?', [passwordHash, user.ci], function(err) {
//                     if (err) {
//                         console.log('Error al actualizar usuario:', err.message);
//                     } else {
//                         console.log(`Contraseña de ${user.usuario} actualizada con éxito`);
//                     }
//                 });
//             });
//         }
//     });
// });

// Verifica si el usuario ya existe antes de insertar
const passwordHash = bcrypt.hashSync('123456', 10); // Hashea la contraseña
db.get('SELECT * FROM usuario WHERE ci = ?', [5], (err, row) => {
    if (err) {
        console.log('Error al consultar la base de datos:', err.message);
    } else if (!row) {
        db.run('INSERT INTO usuario (ci, usuario, password, email, rol) VALUES (?, ?, ?, ?, ?)', 
        [5, 'Soliz', passwordHash, 'correo@ejemplo.com', 'admin'], function(err) {
            if (err) {
                console.log('Error al insertar usuario:', err.message);
            } else {
                console.log('Usuario insertado con éxito');
            }
        });
    } else {
        console.log('El usuario ya existe.');
    }
});
// Ruta para servir el archivo 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para el login
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    db.get('SELECT * FROM usuario WHERE usuario = ?', [usuario], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Imprime la contraseña ingresada y el hash almacenado
        console.log('Contraseña ingresada:', password); // Contraseña ingresada
        console.log('Hash almacenado:', user.password); // Hash almacenado

        // Comparar la contraseña hasheada
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            console.log('Contraseña incorrecta'); // Log para depuración
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Si la contraseña es válida, permite el acceso
        res.status(200).json({ message: 'Acceso permitido', usuario: user });
    });
});


// Ruta para obtener las categorías
app.get('/categorias', (req, res) => {
    db.all('SELECT * FROM categoria', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error en la base de datos' });
        }
        res.status(200).json(rows); // Devuelve las categorías en formato JSON
    });
});
// Configuración de multer para guardar archivos en la carpeta 'public/img'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'img')); // Asegúrate de que esta ruta sea correcta
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Nombre original del archivo
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Asegúrate de servir archivos estáticos

// Ruta para agregar productos
// Ruta para agregar productos
app.post('/agregar-producto', upload.single('imagen'), (req, res) => {
    console.log('Archivo recibido:', req.file); // Verifica si el archivo se recibe
    const nombre = req.body.nombre; // Obtener el nombre del producto
    const precio = req.body.precio; // Obtener el precio del producto
    const imagen = req.file ? `img/${req.file.filename}` : null; // Concatenar 'img/' al nombre del archivo

    // Verificar que los campos no sean nulos
    if (!nombre || !precio || !imagen) {
        return res.status(400).send('Nombre, precio e imagen son obligatorios.');
    }

    db.run('INSERT INTO productos (nombre, precio, imagen) VALUES (?, ?, ?)', [nombre, precio, imagen], function(err) {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.status(200).send('Producto agregado con éxito');
    });
});


// Ruta para obtener productos
app.get('/productos', (req, res) => {
    db.all('SELECT * FROM productos', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error en la base de datos' });
        }
        res.status(200).json(rows); // Devuelve los productos en formato JSON
    });
});

// Ruta para agregar al carrito
app.post('/agregar-al-carrito', (req, res) => {
    const { producto_id, cantidad } = req.body;

    db.run('INSERT INTO carrito (producto_id, cantidad) VALUES (?, ?)', [producto_id, cantidad], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error al agregar al carrito: ' + err.message });
        }
        res.status(201).json({ message: 'Producto agregado al carrito' });
    });
});

// Ruta para obtener productos del carrito con detalles
app.get('/carrito', (req, res) => {
    db.all(`
        SELECT c.id, c.cantidad, p.nombre, p.imagen, p.precio, (c.cantidad * p.precio) AS total
        FROM carrito c 
        JOIN productos p ON c.producto_id = p.id
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error en la base de datos' });
        }
        res.status(200).json(rows); // Devuelve los productos en el carrito con detalles
    });
});

// Ruta para eliminar del carrito
app.delete('/eliminar-del-carrito/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM carrito WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error al eliminar del carrito: ' + err.message });
        }
        res.status(200).json({ message: 'Producto eliminado del carrito' });
    });
});

// Ruta para actualizar la cantidad en el carrito
app.put('/actualizar-cantidad/:id', (req, res) => {
    const id = req.params.id;
    const { cantidad } = req.body;

    db.run('UPDATE carrito SET cantidad = ? WHERE id = ?', [cantidad, id], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error al actualizar la cantidad: ' + err.message });
        }
        res.status(200).json({ message: 'Cantidad actualizada' });
    });
});




// Endpoint para registrar un nuevo usuario
app.post('/registrar', (req, res) => {
    const { ci, usuario, password, email, rol } = req.body;

    // Hashear la contraseña
    const passwordHash = bcrypt.hashSync(password, 10);

    // Insertar el nuevo usuario en la base de datos
    db.run('INSERT INTO usuario (ci, usuario, password, email, rol) VALUES (?, ?, ?, ?, ?)', 
    [ci, usuario, passwordHash, email, rol], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error al registrar el usuario: ' + err.message });
        }
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    });
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});

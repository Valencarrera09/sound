# sound

Colección 3D MONO: 10 discos con fotos locales, audio MP3, letra sincronizada letra por letra, fondo WebGL de río con luna y partículas de polvillo.

## Estructura

- `index.html`, `estilos.css`, `script.js`, `canciones.js`, `three.min.js`: sitio.
- `imagenes/`: las 10 fotos de los discos, `river.jpg` y `imagenes.js` (fotos embebidas comprimidas).
- `sonidos/`: los 10 MP3.

## Uso

Abrir `index.html` con doble clic, o servir esta carpeta con cualquier servidor estático.

Si el navegador bloquea el autoplay, tocar en cualquier lugar para activar el sonido.

## Rendimiento

Los scripts se cargan con `defer`. El fondo WebGL se dibuja a menor resolución, con 4 octavas y 25/30 fps. En celular se reducen las partículas, el antialiasing, la resolución del renderer y el grano de los dorsos. Los cambios de tamaño se agrupan para no recalcular de golpe.

## Publicación

El sitio se publica con GitHub Pages desde la rama `main`, en la raíz del repositorio.

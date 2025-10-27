# Maestros de Mascotas - World of Warcraft

Sitio web en español de España dedicado a coleccionistas y entrenadores de mascotas de World of Warcraft. Incluye guía de obtención, buscador de personajes, recomendaciones estratégicas y tabla de fortalezas/debilidades.

## Navegación principal

Inicio | Buscar personaje | Mascotas | Batallas | Consejos | FAQ | Contacto

## Esqueleto de secciones

- **Inicio**: Hero con bienvenida, llamada a la acción y pregunta interactiva inicial. Placeholder visual destacado.
- **Buscar personaje**: Formulario con campos de nombre, reino y región, filtros opcionales y bloque de resultados con botones de refinado.
- **Mascotas destacadas**: Más de 10 tarjetas con nombre, descripción, método de obtención, consejos y placeholder de imagen.
- **Guía de batallas**: Introducción, tabla de tipos con fortalezas y debilidades, y módulos interactivos de ayuda.
- **Consejos**: Grid de recomendaciones avanzadas, opciones de recordatorio y acciones rápidas.
- **FAQ**: Preguntas frecuentes en formato desplegable con CTA adicional para nuevas dudas.
- **Contacto**: Formulario, opcional de comunidad y placeholder de galería.

## Contenido incluido

- Textos completos en español (UE) diseñados para una experiencia inmersiva de WoW.
- Preguntas interactivas, checkboxes, botones de ayuda contextual y avisos emergentes.
- Placeholders `[IMAGEN_PLACEHOLDER: ...]` para indicar la temática visual de cada bloque.
- Tabla accesible con fortalezas/debilidades por tipo de mascota.

## Estructura de archivos

```
wow-pets-site/
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Ejecutar en local

1. Abre `index.html` en tu navegador preferido.
2. Para un entorno con recarga automática, puedes usar `npx serve` o `python -m http.server` dentro de la carpeta.

## Publicar en GitHub

1. Abre PowerShell y sitúate en la carpeta del proyecto:
   ```powershell
   cd C:\Users\luiso\wow-pets-site
   ```
2. Inicializa el repositorio y crea tu rama principal:
   ```powershell
   git init
   git add .
   git commit -m "Inicializa proyecto Maestros de Mascotas"
   ```
3. Crea el repositorio en GitHub desde la web (usa el mismo nombre si lo deseas) y copia la URL HTTPS.
4. Añade el remoto y sube los cambios:
   ```powershell
   git remote add origin https://github.com/tu-usuario/wow-pets-site.git
   git branch -M main
   git push -u origin main
   ```
5. Activa GitHub Pages en la pestaña **Settings > Pages** seleccionando la rama `main` y raíz (`/`).

## Próximos pasos sugeridos

- Sustituir los placeholders por imágenes oficiales (respetando derechos de autor).
- Conectar el formulario con la API de Blizzard para recuperar datos reales.
- Añadir almacenamiento local para preferencias de usuario.

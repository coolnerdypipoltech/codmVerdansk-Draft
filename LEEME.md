# Draft Señal Verdansk · Herramienta de operación

Herramienta para repartir a los 50 finalistas de cada jornada entre los 25 squads de creadores, en vivo y con la regla del draft, y mostrar el reparto en stream con el look del show.

Tiene dos pantallas que hablan entre sí:

- **Panel del operador** (`/operador`): lo usa el equipo de Comp Ops. Carga los datos, calcula el reparto y avanza jugador por jugador.
- **Salida de stream** (`/salida`): pantalla limpia de 1920 x 1080 que se pone como fuente de navegador en OBS o vMix. Es lo que ve la audiencia.

Todo corre en una sola computadora, sin internet y sin instalar nada más que Node.js. Los datos de los jugadores no salen de esa computadora.

El panel y la salida son una aplicación de **React** (carpeta `client/`) ya compilada a archivos estáticos en `client/build/`; `server.js` solo sirve esos archivos y la API/los datos. Para operar el draft **no hace falta compilar nada**: `client/build` ya viene listo. Solo hace falta volver a compilar si tú mismo cambias algo del código de la interfaz (ver sección 8).

---

## 1. Lo que necesitas

| Qué | Detalle |
|---|---|
| Computadora | Windows, Mac o Linux, la que opere el panel |
| Node.js | Versión 18 o superior (LTS). Descarga en https://nodejs.org |
| Navegador | Chrome o Edge para el panel |
| Stream | OBS o vMix con una fuente de navegador de 1920 x 1080 |

## 2. Arranque

Primero instala **Node.js LTS**: entra a https://nodejs.org y pulsa el botón verde "Download Node.js (LTS)". Instálalo con "Siguiente" a todo. Para comprobarlo, abre Terminal (Mac) o Símbolo del sistema (Windows) y escribe `node -v`: debe responder un número de versión 18 o mayor.

- **Windows:** doble clic en `iniciar.bat`.
- **Mac:** doble clic en `iniciar.command`.
- **Linux:** `./iniciar.sh`.

Se abre una ventana negra (el servidor) y el navegador con el panel en `http://localhost:8787/operador`. **No cierres la ventana negra durante el evento.** Para apagar: Ctrl+C o cerrarla.

**Aviso de seguridad la primera vez.** El programa no está firmado por Apple ni por Microsoft (firmar cuesta una cuota anual de desarrollador), así que el sistema pide confirmación. El archivo es texto plano y puedes abrirlo para leerlo.

- **Mac:** en el aviso pulsa **Listo** (no "Mover al basurero"). Ve a Ajustes del Sistema, Privacidad y seguridad, baja hasta Seguridad, y junto a "iniciar.command" pulsa **Abrir de todos modos**; pon tu contraseña. En versiones recientes de macOS el clic derecho, Abrir ya no salta este aviso. Alternativa sin avisos: abre Terminal, escribe `cd ` (con espacio), arrastra la carpeta `draft-senal-verdansk` a la ventana, pulsa Enter y escribe `node server.js`; luego abre `http://localhost:8787/operador` en el navegador.
- **Windows:** si aparece "Windows protegió tu PC", pulsa **Más información** y luego **Ejecutar de todas formas**.

## 3. Poner la salida en OBS o vMix

**OBS:** Fuentes, Agregar, Navegador. URL `http://localhost:8787/salida`, ancho 1920, alto 1080. Desmarca "Apagar fuente cuando no está visible" y "Actualizar navegador cuando la escena se active".

**vMix:** Add Input, Web Browser, 1920 x 1080, misma URL.

El botón **Abrir salida ↗** arriba del panel abre esa misma URL en una pestaña nueva del navegador, útil para revisarla o copiarla sin tener que escribirla.

Junto a ese botón está **Fondo sólido / Fondo transparente**: lo cambia al instante en la salida (sin recargarla ni reconfigurar nada en OBS), quitando también las imágenes de fondo de cada escena para que solo quede la gráfica encima del video. Es el mismo efecto que `?bg=transparente` en la URL, pero se activa y desactiva en vivo desde el panel.

Fondos opcionales, agregando al final de la URL (además del botón del panel):

- `?bg=transparente` para poner la gráfica encima del video.
- `?bg=croma` para fondo verde `#00B140` y usar un chroma key.

Si tu vMix no respeta la transparencia de la página, usa `?bg=croma` con un chroma key.

La salida arranca sin gráficos ("0 · Nada"): solo el fondo (o nada, con `?bg=transparente`), así que puedes dejarla cargada en la escena y mostrar la gráfica con un clic desde el panel. Si se corta la conexión con el servidor, la pantalla muestra "Sin conexión con el servidor" y se reconecta sola.

**Si el switcher está en otra PC:** abre `iniciar-red.bat` (pide un PIN) o en Mac/Linux `./iniciar.sh --host 0.0.0.0 --pin TUPIN`. La ventana muestra la dirección, por ejemplo `http://192.168.1.20:8787/salida`. La salida no pide PIN para que OBS pueda leerla; el panel sí. En Windows, si pregunta por el Firewall, permite redes privadas. Sin PIN, cualquiera en la red puede operar el draft: no uses `--host 0.0.0.0` sin `--pin`. Usa un PIN solo con letras y números.

## 4. Flujo del día del qualifier

**Antes del evento (hazlo con tiempo):**

1. Abre el panel, pestaña **1 · Datos**.
2. Carga el CSV de **creadores** (ver formato abajo). El nivel (1 a 5) lo define CNP con Activision. Si CNP no define niveles, elige el método **Snake** en Ajustes del Draft en vivo.
3. Ensaya con **Cargar datos de ejemplo**, haz un draft completo y al terminar, en la **Zona de riesgo** de la pestaña Datos, escribe `BORRAR` y pulsa **Borrar todos los datos** para dejar limpio.
4. Prueba la fuente en OBS o vMix y la conexión de red si aplica.

**Al terminar la Jornada 1:**

1. Pestaña **1 · Datos**, cuadro "Jugadores · Jornada 1": pega la tabla desde Excel o Google Sheets, o elige el archivo CSV. Pulsa **Revisar** (muestra errores y avisos sin guardar) y luego **Cargar**.
2. Pestaña **2 · Draft en vivo**, Jornada 1, **Recalcular reparto**. Aquí se calcula todo y se fija la huella de los datos. Desde este momento el reparto no cambia.
3. Escena **1 · Los finalistas** para presentar a los 50 y **2 · Tablero del draft** para empezar.
4. **Siguiente** (barra espaciadora) revela un jugador y el creador que lo recibe. **Auto** avanza solo cada 3,5 s (se cambia en Ajustes). **Deshacer** retrocede un paso.
5. Al terminar, escena **3 · Resultado** para ver los 25 squads con la Jornada 1. Junto al selector de escena hay otro para elegir si el resultado sale en **1 pantalla** (todas las botargas juntas) o partido en **parte 1 / parte 2** (más legible con muchas botargas); se puede cambiar en cualquier momento, incluso con la escena ya al aire.
6. Pestaña **3 · Resultados**, **Cerrar Jornada 1** (dos clics). Guarda el CSV de squads y el acta en la carpeta `salidas`.

**Jornada 2:** igual, con su propio CSV de jugadores. La Jornada 2 solo se puede calcular después de cerrar la 1, porque el reparto depende de cómo quedaron los squads. Al cerrar la 2 tienes el CSV final y el acta completa.

**Si alguien no confirma o no es elegible:** pestaña **3 · Resultados**, Sustituciones. Entra una reserva en el mismo lugar del que sale. Queda registrado en el acta. Solo se puede hacer cuando la jornada terminó de repartirse.

## 5. Qué ve cada quien

- La audiencia ve solo lo que aparece en la salida. El servidor nunca le manda a la salida el plan futuro, solo los jugadores ya revelados. No hay forma de "espiar" el destino desde la pantalla de stream.
- El operador sí puede ver el destino con **Ver destino (solo operador)** para prepararse antes de pulsar Siguiente.
- El recuadro "En pantalla" arriba a la izquierda del panel es una vista previa de lo que sale al aire.

## 6. Atajos de teclado (en el panel)

| Tecla | Acción |
|---|---|
| Espacio o flecha derecha | Siguiente jugador |
| Retroceso o flecha izquierda | Deshacer |
| A | Auto encendido o apagado |
| 0, 1, 2, 3, 4 | Escena: nada, finalistas, tablero, resultado, un squad |

## 7. Formato de los CSV

Puedes pegar directo desde Excel o Google Sheets, o subir un CSV (separado por comas, punto y coma o tabulaciones). Si usas Excel, guarda como **CSV UTF-8** para que los acentos se vean bien. Los encabezados no distinguen mayúsculas ni acentos y aceptan varios nombres. En el panel hay un enlace **Descargar plantilla**.

**Creadores** (una fila por creador):

| Columna | Obligatoria | Notas |
|---|---|---|
| `orden` | No | Número del creador. Si falta, va por orden de fila |
| `nombre` | Sí | Como se verá en pantalla |
| `handle` | No | Canal o usuario |
| `nivel` | Para Híbrido | 1 a 5. Nivel 5 es el creador más fuerte |
| `botarga` | No | Agrupa los squads en el resultado final (por ejemplo "Botarga 1") |
| `foto` | No | Ruta de la foto, por ejemplo `/assets/fotos/creador01.png` |

**Jugadores** (una fila por jugador, 2 x cantidad de creadores clasificados por jornada, más reservas):

| Columna | Obligatoria | Notas |
|---|---|---|
| `jornada` | Una de las tres | 1 o 2 |
| `bloque` | Una de las tres | A y B son la Jornada 1, C y D la Jornada 2 |
| `puesto` | Sí (recomendado) | Puesto oficial en el ranking de la jornada, 1 a 50 sin huecos ni repetidos |
| `nick` | Sí | Gamertag como debe salir en pantalla |
| `nombre`, `id`, `discord` | No | Para el acta y para tu control |
| `puntos`, `bajas` | No | Si falta `puesto`, se calcula por puntos y bajas y se avisa que confirmes con Activision |
| `reserva` | No | `si` marca a un reservista. También se consideran reservas los puestos mayores a 50 |

La revisión avisa de puestos repetidos o faltantes, nicks repetidos, el mismo nick en las dos jornadas, el mismo ID con dos nicks y jornadas sin reservas.

En la carpeta `ejemplo` hay tres CSV de muestra con datos inventados.

## 8. Personalizar el look del show

Hoy la salida usa fuentes y colores de relleno parecidos al show. Cuando CNP entregue su paquete gráfico oficial, se cambia sin tocar la lógica:

- **Logos y fondo:** copia a `public/assets/show/` los archivos `logo-izq.png`, `logo-der.png` (PNG con transparencia, mínimo 120 px de alto) y `fondo.jpg` (1920 x 1080). Se detectan por nombre; recarga la fuente del navegador en OBS. Esto no requiere recompilar nada, son archivos sueltos.
- **Logo fijo (esquina superior derecha):** copia `logo.png` a `public/assets/show/`. Aparece arriba a la derecha en todas las escenas (se oculta igual que el pie cuando la escena es "0 · Nada").
- **Fotos de creadores:** archivos en `public/assets/fotos/` y su ruta en la columna `foto`. Aparecen como avatar en el tablero y en grande en la escena de un squad.
- **Imágenes de botarga:** archivos en `public/assets/botargas/`. Aparecen junto al nombre de la botarga en la escena "4 · Un squad". El mapeo nombre de botarga → archivo está en `client/src/pages/Salida/salidaUtils.js`, constante `BOTARGA_PHOTOS`; si cambian los nombres o la cantidad de botargas, esa lista se actualiza ahí (y hay que recompilar, ver abajo).
- **Colores y tipografías de la salida:** variables CSS en `client/src/pages/Salida/SalidaPage.css`, bloque `.salida-page{...}`. Las fuentes (Anton, Michroma, Barlow Condensed, Barlow) tienen licencia libre OFL y se referencian en `client/src/pages/Salida/fonts.js`. Para usar las oficiales, copia los `.woff2` a `public/assets/fonts/` (mismo nombre de archivo) o cambia las rutas en ese archivo.
- **Banners detrás de los títulos:** el kicker y el título grande de las escenas "Tablero", "Finalistas" y "Resultado" van sobre una imagen de banner (`client/src/pages/Salida/assets/banner-red.png` para Finalistas, `banner-gold.png` para las otras dos). Para cambiar esas imágenes, reemplaza esos archivos (mismo nombre) o ajusta las rutas en `client/src/pages/Salida/components/SceneTitle/SceneTitle.css`.
- **Fondo de cada escena:** cada una de las 4 escenas con gráfica (Finalistas, Tablero, Resultado, Un squad) tiene su propia imagen de fondo en `client/src/pages/Salida/assets/bg-pool.webp`, `bg-board.webp`, `bg-final.webp` y `bg-squad.webp`. Para cambiarlas, reemplaza el archivo (mismo nombre, ideal 1920x1080 o proporción 16:9) o ajusta la ruta en el `.css` de esa escena (por ejemplo `client/src/pages/Salida/scenes/BoardScene/BoardScene.css`).
- **Colores del panel del operador:** variables CSS en `client/src/pages/Operador/OperadorPage.css`, bloque `.operador-page{...}`.
- **Espaciados, radios y tipografía de interfaz compartidos:** variables CSS en `client/src/index.css` (`--space-*`, `--radius-*`, `--font-ui`, etc.), usadas por todos los componentes del panel.
- **Título en pantalla:** Draft en vivo, Ajustes, "Título en pantalla".
- **Mostrar nivel de creador en pantalla:** apagado por defecto.
- **Marcar banca:** señala en pantalla, en cada squad completo, al jugador de peor puesto (número más alto), el que no suma a su puntaje. Es informativo: la regla de quién queda en banca la decide el capitán.

**Si cambias algo dentro de `client/src/`** (colores, textos, componentes, `BOTARGA_PHOTOS`, etc.), hay que volver a generar `client/build` para que el cambio se vea, porque `server.js` sirve ese build ya compilado y no el código fuente. Con Node.js instalado:

```
cd client
npm install        (solo la primera vez, o si cambiaste las dependencias)
npm run build
```

Luego reinicia `iniciar.bat`/`iniciar.sh`/`iniciar.command` (o el proceso de `node server.js`) y recarga (F5) las pestañas del panel y de la salida — Node no recarga el código solo, y el navegador tampoco recarga el JavaScript que ya tenía cargado.

Para desarrollar con recarga en caliente en vez de compilar cada vez, corre `npm start` dentro de `client/` (abre un servidor de desarrollo aparte en `http://localhost:3000`); la API y el SSE los sigue sirviendo `node server.js` en el puerto 8787 normalmente.

## 9. Reglas que aplica el reparto

Es una sola regla: **del mejor jugador al peor, cada uno va al squad que lleva menos puntos**, con máximo 2 jugadores por creador en cada jornada y 4 en total.

- La fuerza de un jugador es `2N + 1 - puesto` (con 25 creadores, el puesto 1 vale 50).
- Puntos del squad = puntos de nivel del creador + las 3 mejores fuerzas de sus jugadores (el cuarto es la banca).
- **Híbrido:** el creador suma `(nivel - 1) x 6` puntos de salida (el 6 se cambia en Ajustes). Los creadores más fuertes salen con más puntos y reciben jugadores más tarde. Sin niveles se usa **Snake** (todos en cero).
- Empates: gana el creador con número más bajo en la Jornada 1 y el más alto en la Jornada 2.
- El método y los puntos por nivel no se pueden cambiar con un reparto en curso.

## 10. Respaldo y plan B

- **Guardado automático.** Cada acción se guarda en `datos/estado.json`. Si la computadora o el servidor se reinician, abre otra vez `iniciar` y continúas en el mismo paso (se probó). Copia la carpeta `datos` como respaldo.
- **El reparto es determinista.** Con los mismos CSV y los mismos ajustes, cualquier otra computadora calcula exactamente lo mismo. Plan B recomendado: una segunda laptop con la herramienta y los mismos datos cargados. Si falla la principal, se pulsa Recalcular reparto y se avanza hasta el mismo paso. La huella (código que aparece junto a "Reparto calculado") debe coincidir en las dos.
- **Modo manual.** La tabla "Squads en vivo" del panel y las exportaciones CSV permiten anunciar el reparto sin la gráfica.
- Cada acción de importar, calcular, avanzar, cerrar y sustituir queda en el registro del estado.

## 11. Acta y verificación

Al cerrar cada jornada se guardan en `salidas`:

- `squads_jornadaN_FECHA.csv`: los squads.
- `acta_jornadaN_FECHA.json` y `.html`: datos de entrada, ajustes, el reparto pick por pick, huella SHA-256 y sustituciones. El `.html` se imprime o se manda como PDF.

Para que Activision o un tercero compruebe que el resultado es el que dicta la regla:

```
node verificar.js salidas/acta_jornada2_FECHA.json
```

Recalcula el reparto desde cero con los mismos datos y confirma, pick por pick, que coincide con el acta y con la huella. Si alguien altera el acta, lo detecta.

## 12. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| "Sin conexión con el servidor" en la salida | La ventana negra se cerró. Ábrela de nuevo con `iniciar`; la salida se reconecta sola |
| "El puerto 8787 ya está en uso" | Ya hay otra ventana del draft abierta. Ciérrala o usa `--port 8788` |
| Fuente de navegador en blanco en OBS | Revisa la URL y el tamaño 1920 x 1080. Clic derecho, Actualizar caché de la fuente |
| Aparecen letras raras en los nicks | Guarda el CSV como UTF-8 |
| "Primero calcula el reparto" | Pulsa Recalcular reparto en Draft en vivo |
| Datos de ejemplo mezclados con los reales | Pestaña Datos, Zona de riesgo, Borrar todos los datos, y carga de nuevo |
| Corrigiste un CSV después de calcular | Draft en vivo, **Reiniciar jornada** (dos clics), carga el CSV corregido y recalcula. Si ya cerraste la jornada: pestaña Resultados, **Reabrir una jornada**, escribe `REABRIR`. Reabrir la Jornada 1 también borra la 2 |

## 13. Carpetas

```
iniciar.bat / iniciar.command / iniciar.sh   Arranque
iniciar-red.bat                              Arranque en red con PIN (Windows)
server.js                                    Servidor (API, datos, SSE, sirve client/build)
verificar.js                                 Verificador de actas
lib/engine.js                                Regla del draft (única fuente de verdad)
client/src/pages/Operador/                   Panel del operador (componentes React)
client/src/pages/Salida/                     Salida de stream (componentes React)
client/build/                                Build de React ya compilado (lo sirve server.js)
public/assets/show, fotos, fonts, botargas   Logos, fondo, fotos, tipografías e imágenes de botarga
ejemplo/                                     CSV de muestra (datos inventados)
datos/                                       Estado guardado (respaldar)
salidas/                                     CSV y actas al cerrar jornadas
```

Dentro de `client/src/`, cada sección del panel y de la salida es un componente con su propio archivo `.jsx` y su propio archivo `.css` (por ejemplo `client/src/pages/Operador/components/DraftPane/SceneControls.jsx` y `SceneControls.css`). Las clases que se repiten mucho (botones, tarjetas, chips) están en `client/src/App.css` (panel) y en `client/src/pages/Salida/SalidaPage.css` (salida).

## 14. Privacidad

Los nicks, nombres, IDs y Discord de los jugadores (algunos pueden ser menores de edad) viven solo en `datos/` y `salidas/` de la computadora donde corre la herramienta. No se envía nada a internet. Al terminar el evento, guarda las actas donde corresponda y borra la carpeta `datos`.

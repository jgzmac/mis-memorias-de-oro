# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a **Mis Memorias de Oro**! 💛

## Cómo contribuir

### Reportar Bugs

Si encuentras un bug:

1. **Verifica** que no esté ya reportado en [Issues](https://github.com/tuusuario/mis-memorias-de-oro/issues)
2. **Crea un nuevo Issue** con:
   - Título claro y descriptivo
   - Descripción detallada del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Tu ambiente (OS, Node version, navegador)

### Sugerir Features

Si tienes una idea:

1. **Abre un Discussion** o crea un Issue con la etiqueta `enhancement`
2. **Describe** claramente el feature
3. **Explica** por qué sería útil
4. **Sugiere** ejemplos de uso si aplica

### Pull Requests

**Antes de empezar:**

```bash
# Fork el repositorio en GitHub
# Clona tu fork
git clone https://github.com/YOUR_USERNAME/mis-memorias-de-oro.git
cd mis-memorias-de-oro

# Crea una rama
git checkout -b feature/amazing-feature
```

**Desarrollo:**

```bash
# Instala dependencias
npm install

# Inicia el servidor
npm run dev

# En otra terminal, ejecuta tests (cuando estén disponibles)
npm test
```

**Commits:**

- Usa mensajes claros y descriptivos
- Referencia Issues si aplica: `Fix #123`
- Ejemplos: `Add photo upload feature`, `Fix memory deletion bug`

```bash
git commit -m "Add amazing feature"
```

**Push y PR:**

```bash
git push origin feature/amazing-feature
```

Luego abre un Pull Request con:
- Descripción clara de cambios
- Issue(s) que soluciona (si aplica)
- Screenshots/GIFs si son cambios visuales
- Testing checklist completado

## Directrices de Código

### Style Guide

- **Indentación:** 2 espacios
- **Punto y coma:** Obligatorio
- **Comillas:** Comillas simples en JS, dobles en JSON
- **Nombres:** camelCase para variables/funciones, PascalCase para clases

### JavaScript

```javascript
// ✅ Bueno
function getUserMemories(userId, filters = {}) {
  const memories = db.prepare('SELECT * FROM memories WHERE user_id = ?').all(userId);
  return memories;
}

// ❌ Malo
function get_user_memorys(userId,filters){let mem = db.prepare('SELECT * FROM memories WHERE user_id = ?').all(userId); return mem;}
```

### HTML/CSS

```html
<!-- ✅ Bueno: semántico y accesible -->
<button aria-label="Crear memoria" onclick="createMemory()">+ Crear</button>

<!-- ❌ Malo: poco semántico -->
<div onclick="createMemory()">Crear</div>
```

### Git Commits

```bash
# ✅ Bueno
git commit -m "Add photo upload to memory detail"
git commit -m "Fix: memory deletion confirmation dialog not showing"
git commit -m "Docs: update API endpoint examples"

# ❌ Malo
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "aaaaaa"
```

## Estructura del Proyecto

```
src/
├── server.js           # Entrada principal
├── db.js               # Base de datos
├── api/
│   └── handlers.js     # Lógica de negocio
├── auth.js
└── memories.js

public/
└── index.html          # Frontend SPA

config/                 # Configuración
docs/                   # Documentación
tests/                  # Tests (próximo)
```

## Checklist para PRs

Antes de abrir un PR, verifica:

- [ ] Tests pasan (cuando estén disponibles)
- [ ] Sin conflictos de merge
- [ ] Código sigue el style guide
- [ ] Commits tienen mensajes claros
- [ ] Documentación actualizada (si aplica)
- [ ] Sin archivos innecesarios

## Áreas donde Necesitamos Ayuda

### Priority 🔴
- Tests unitarios
- Tests de integración
- Documentación API
- Bug fixes

### Medium 🟡
- Features de v1.1 (búsqueda, exportar)
- Optimizaciones de performance
- Ejemplos de uso

### Nice to Have 🟢
- Traducción (i18n)
- Temas adicionales
- Animaciones
- Iconografía mejorada

## Comunicación

### Slack/Discord
*Próximamente disponible*

### GitHub Discussions
Usamos [GitHub Discussions](https://github.com/tuusuario/mis-memorias-de-oro/discussions) para conversaciones abiertas.

### Issues
Solo para bugs, features y tareas específicas.

## Código de Conducta

Por favor, sé respetuoso con otros contribuidores:

- Sé inclusivo
- Sé profesional
- Sé constructivo
- Sé paciente

Cualquier comportamiento abusivo será rechazado.

## Reconocimiento

Todos los contribuidores serán reconocidos en:
- README.md
- Releases notes
- GitHub contributors page

## Preguntas?

- 📧 Email: javier@example.com
- 💬 GitHub Issues: Abre una pregunta
- 📚 Docs: Ver carpeta `/docs`

---

**¡Gracias por contribuir! 🙏**

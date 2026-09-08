# CLAUDE.md - Mis Memorias de Oro

## Descripción del Proyecto

**Mis Memorias de Oro** es una aplicación funcional en modo piloto que implementa funcionalidades de forma incremental con una interfaz de usuario integrada.

## Estructura del Proyecto

```
Mis Memorias de Oro/
├── src/              # Código fuente principal
│   ├── components/   # Componentes reutilizables (si aplica)
│   ├── pages/        # Páginas principales (si aplica)
│   ├── utils/        # Funciones de utilidad
│   ├── api/          # Lógica de backend/API
│   └── index.js      # Punto de entrada
├── inputs/           # Archivos de entrada y datos
├── outputs/          # Archivos generados/procesados
├── config/           # Archivos de configuración
│   ├── .env.example  # Variables de entorno de ejemplo
│   └── config.js     # Configuración general
├── docs/             # Documentación
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── SETUP.md
├── tests/            # Tests y pruebas
│   └── unit/
├── assets/           # Recursos (imágenes, iconos, estilos)
├── README.md         # Descripción general
├── CLAUDE.md         # Este archivo
└── .gitignore        # Archivos ignorados por git
```

## Convenciones de Código

- **Nomenclatura**: camelCase para variables/funciones, PascalCase para componentes
- **Comentarios**: Explicar el "por qué", no el "qué"
- **Commits**: Mensajes descriptivos en presente: "Add feature X", "Fix bug in Y"
- **Ramas**: `feature/nombre-funcionalidad`, `fix/descripcion-bug`, `docs/actualizacion`

## Workflow de Desarrollo

1. **Crear rama** desde `main`: `git checkout -b feature/nombre`
2. **Implementar cambios** en `src/`
3. **Escribir tests** en `tests/`
4. **Documentar** cambios en `docs/`
5. **Commit y push** con mensaje descriptivo
6. **Pull request** con descripción clara

## Herramientas y Stack

- **Lenguaje**: [Especificar: Node.js, Python, etc.]
- **Framework UI**: [Especificar: React, Vue, etc.]
- **Testing**: [Especificar: Jest, Pytest, etc.]
- **Versión Control**: Git

## Próximos Pasos

- [ ] Definir stack tecnológico específico
- [ ] Crear archivos base en `src/`
- [ ] Configurar ambiente de desarrollo
- [ ] Implementar funcionalidades incrementales
- [ ] Establecer CI/CD

## Notas para Colaboradores

- Mantener la estructura de carpetas consistente
- Cada funcionalidad nueva debe incluir tests
- Actualizar documentación con cambios significativos
- Los archivos en `outputs/` se generan automáticamente (no commitear)
- Los archivos en `inputs/` son ejemplos/fixtures (solo si son necesarios para el proyecto)

## Cómo Comenzar

```bash
# Clonar y configurar
git clone [repositorio]
cd Mis\ Memorias\ de\ Oro

# Instalar dependencias (según stack)
npm install  # o: pip install -r requirements.txt

# Ejecutar ambiente de desarrollo
npm run dev  # o: python app.py

# Ejecutar tests
npm test     # o: pytest
```

## Documentación Relacionada

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Diseño técnico
- [API.md](docs/API.md) - Endpoints y funciones
- [SETUP.md](docs/SETUP.md) - Configuración del ambiente

---

**Última actualización**: 2026-07-28

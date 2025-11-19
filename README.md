# Proyecto Consumo API SOAP - Banco de Guatemala

Este proyecto implementa el consumo de la API SOAP del Banco de Guatemala para obtener tipos de cambio de monedas, usando Node.js como backend y Astro como frontend, con almacenamiento en base de datos MySQL.

## 🎯 Objetivo

Consumir la API SOAP del Banco de Guatemala (`TipoCambioDia`) para obtener tipos de cambio de diferentes monedas y almacenarlos en una base de datos MySQL para su consulta posterior.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + SOAP Client (Puerto 3001)
- **Frontend**: Astro (Puerto 4321)
- **Base de Datos**: MySQL 8.0+ 
- **API Externa**: SOAP del Banco de Guatemala
- **Formato de Datos**: XML → JSON → MySQL

## 📊 API SOAP Consumida

- **URL**: `http://www.banguat.gob.gt/variables/ws/tipocambio.asmx`
- **Método**: `TipoCambioDia`
- **Protocolo**: SOAP 1.1 / 1.2
- **Formato**: XML
- **Datos**: Tipos de cambio diarios de múltiples monedas

## 🗄️ Estructura del Proyecto

```
├── backend/                  # Servidor Node.js + Express
│   ├── src/
│   │   ├── app.js           # Servidor principal
│   │   ├── controllers/     # Controladores de API
│   │   ├── services/        # Lógica de negocio
│   │   │   ├── apiService.js      # Cliente SOAP
│   │   │   └── databaseService.js # Conexión MySQL
│   │   └── routes/          # Rutas de la API
│   ├── .env                 # Variables de entorno
│   └── package.json
├── frontend/                # Sitio web con Astro
│   ├── src/
│   │   ├── layouts/         # Layout principal
│   │   ├── pages/           # Páginas del sitio
│   │   └── components/      # Componentes reutilizables
│   └── package.json
├── database/                # Scripts de base de datos
│   ├── create_database.sql  # Script de creación
│   └── README.md           # Documentación BD
├── package.json             # Scripts principales
└── README.md               # Este archivo
```

## ⚙️ Configuración e Instalación

### 1. Prerrequisitos

- **Node.js 16+**
- **MySQL 8.0+**
- **Git**

### 2. Clonar el Repositorio

```bash
git clone https://github.com/WillyBarrios/Consumo_API_ExamenF.git
cd Consumo_API_ExamenF
```

### 3. Configurar Base de Datos

```bash
# 1. Crear la base de datos
mysql -u root -p

# 2. Ejecutar script de creación
mysql -u root -p < database/create_database.sql

# 3. Verificar instalación
# Ver database/README.md para instrucciones detalladas
```

### 4. Configurar Variables de Entorno

```bash
# Editar backend/.env
cd backend
cp .env.example .env  # Si existe, o crear manualmente

# Configurar:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=api_banguat_tipocambio
DB_USER=root
DB_PASSWORD=tu_password
SOAP_API_URL=http://www.banguat.gob.gt/variables/ws/tipocambio.asmx
```

### 5. Instalar Dependencias

#### Instalación Completa (Recomendado)
```bash
npm run install:all
```

#### Instalación Individual
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 🚀 Ejecutar el Proyecto

### Opción 1: Ejecutar Todo (Recomendado)
```bash
npm run dev
```

### Opción 2: Ejecutar por Separado
```bash
# Terminal 1 - Backend (Puerto 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (Puerto 4321)
cd frontend
npm run dev
```

## 🌐 URLs del Proyecto

- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Info Sistema**: http://localhost:3001/info

## 📋 Endpoints de la API

### 🏦 Endpoints Principales (Banguat)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/tipos-cambio` | Tipos de cambio actuales |
| `GET` | `/api/tipos-cambio/:monedaId` | Historial de una moneda |
| `GET` | `/api/monedas` | Lista de monedas disponibles |
| `GET` | `/api/dolar` | Tipo de cambio del dólar |
| `POST` | `/api/actualizar` | Actualizar datos desde SOAP |
| `GET` | `/api/estadisticas` | Estadísticas del sistema |

### 🔧 Endpoints de Testing

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/test/soap` | Probar conexión SOAP |
| `GET` | `/api/test/database` | Probar conexión BD |
| `GET` | `/health` | Health check completo |
| `GET` | `/info` | Información del sistema |

### 🔄 Endpoints de Compatibilidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/users` | Monedas (como usuarios) |
| `GET` | `/api/posts` | Tipos cambio (como posts) |
| `GET` | `/api/users/:id` | Moneda específica |
| `GET` | `/api/posts/:id` | Tipo cambio específico |

## 📱 Páginas del Frontend

- **Inicio**: Información del proyecto y tecnologías
- **Usuarios**: Lista de monedas disponibles (compatibilidad)
- **Posts**: Tipos de cambio actuales (compatibilidad)
- **Acerca de**: Documentación técnica completa

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **SOAP Client** - Cliente para servicios SOAP
- **xml2js** - Parser XML a JSON
- **MySQL2** - Driver de MySQL
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno

### Frontend
- **Astro** - Framework de sitios web modernos
- **JavaScript** - Lenguaje principal
- **CSS3** - Estilos modernos y responsive
- **HTML5** - Estructura semántica

### Base de Datos
- **MySQL 8.0+** - Sistema de gestión de base de datos
- **InnoDB** - Motor de almacenamiento
- **UTF8MB4** - Charset para soporte completo Unicode

## 🔄 Flujo de Datos

```
1. Frontend solicita datos → Backend
2. Backend consulta BD local → Si hay datos recientes, los devuelve
3. Si no hay datos o están desactualizados:
   a. Backend llama a API SOAP Banguat
   b. Procesa respuesta XML
   c. Almacena en MySQL
   d. Devuelve datos al Frontend
4. Frontend muestra los datos al usuario
```

## 📊 Estructura de Datos

### API SOAP Response (XML)
```xml
<TipoCambioDiaResult>
  <Variables>
    <Variable>
      <moneda>2</moneda>
      <descripcion>Dólar Estadounidense</descripcion>
    </Variable>
  </Variables>
  <CambioDia>
    <Var>
      <moneda>2</moneda>
      <fecha>2025-11-18</fecha>
      <venta>7.85</venta>
      <compra>7.65</compra>
    </Var>
  </CambioDia>
  <CambioDolar>
    <VarDolar>
      <fecha>2025-11-18</fecha>
      <referencia>7.75</referencia>
    </VarDolar>
  </CambioDolar>
</TipoCambioDiaResult>
```

### Base de Datos (MySQL)
```sql
-- Tabla de monedas
monedas: codigo_moneda, descripcion, simbolo

-- Tipos de cambio
tipos_cambio_historico: moneda_id, fecha, tipo_compra, tipo_venta

-- Referencias del dólar
cambio_dolar_referencia: fecha, referencia
```

## 🧪 Testing

### Test Manual
```bash
# 1. Verificar backend
curl http://localhost:3001/health

# 2. Test base de datos
curl http://localhost:3001/api/test/database

# 3. Test servicio SOAP
curl http://localhost:3001/api/test/soap

# 4. Obtener tipos de cambio
curl http://localhost:3001/api/tipos-cambio

# 5. Actualizar datos
curl -X POST http://localhost:3001/api/actualizar
```

### Test Frontend
1. Ir a http://localhost:4321
2. Navegar por las diferentes páginas
3. Verificar que los datos se muestren correctamente

## 🚨 Solución de Problemas

### Backend no inicia
```bash
# Verificar variables de entorno
cd backend
cat .env

# Verificar conexión BD
mysql -u root -p -e "SHOW DATABASES;" | grep banguat

# Verificar logs
npm run dev
```

### No se obtienen datos
```bash
# Verificar conexión a API SOAP
curl -X POST http://localhost:3001/api/actualizar

# Verificar en base de datos
mysql -u root -p api_banguat_tipocambio -e "SELECT COUNT(*) FROM tipos_cambio_historico;"
```

### Frontend no muestra datos
1. Verificar que backend esté corriendo (puerto 3001)
2. Verificar logs en consola del navegador
3. Verificar CORS en backend

## 📈 Características Implementadas

✅ **Consumo de API SOAP**
- Cliente SOAP completo
- Manejo de errores y timeouts
- Parsing XML a JSON
- Logging de consultas

✅ **Base de Datos MySQL**
- Estructura normalizada
- Procedimientos almacenados
- Vistas para consultas optimizadas
- Auditoría de operaciones

✅ **API REST Backend**
- Endpoints RESTful
- Middleware de seguridad
- Manejo de errores robusto
- Documentación automática

✅ **Frontend Moderno**
- Interfaz responsive
- Páginas estáticas optimizadas
- Componentes reutilizables
- Navegación intuitiva

✅ **Arquitectura Escalable**
- Separación de responsabilidades
- Servicios modulares
- Configuración por variables de entorno
- Logging estructurado

## 👨‍💻 Desarrollado por

**WillyBarrios**  
Proyecto de Examen Final  
Noviembre 2025

## 📄 Licencia

MIT License - Ver LICENSE para más detalles

## 🤝 Contribuciones

Este es un proyecto académico, pero sugerencias y mejoras son bienvenidas a través de issues en GitHub.

---

## 📞 Soporte

Para problemas o preguntas sobre el proyecto, revisar:

1. **Logs del backend**: `backend/npm run dev`
2. **Documentación BD**: `database/README.md`
3. **Health check**: `http://localhost:3001/health`
4. **Info del sistema**: `http://localhost:3001/info`
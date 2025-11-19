# ===============================================
# INSTRUCCIONES PARA EJECUTAR DDL EN MARIADB
# ===============================================

## OPCIÓN 1: Comando directo (RECOMENDADO)
Abre una nueva ventana de PowerShell y ejecuta:

```powershell
cd "c:\Dev\Consumo_API_ExamenF\database"
& "C:\Program Files\MariaDB 12.0\bin\mysql.exe" -u root -p < create_database.sql
```

Cuando te solicite la contraseña, ingrésala y presiona Enter.

## OPCIÓN 2: Desde la consola de MariaDB
1. Abre la consola de MariaDB:
```powershell
& "C:\Program Files\MariaDB 12.0\bin\mysql.exe" -u root -p
```

2. Una vez conectado, ejecuta:
```sql
source c:/Dev/Consumo_API_ExamenF/database/create_database.sql;
```

## OPCIÓN 3: Con HeidiSQL o similar
Si tienes una herramienta gráfica como HeidiSQL:
1. Conecta a tu servidor MariaDB
2. Abre el archivo create_database.sql
3. Ejecuta el script

## VERIFICAR DESPUÉS DE LA EJECUCIÓN
Ejecuta estas consultas para verificar que todo se creó correctamente:

```sql
-- Verificar que la base de datos existe
SHOW DATABASES LIKE 'api_banguat_tipocambio';

-- Usar la base de datos
USE api_banguat_tipocambio;

-- Ver todas las tablas
SHOW TABLES;

-- Verificar datos en monedas
SELECT * FROM monedas;

-- Verificar vistas
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

## ACTUALIZAR CONFIGURACIÓN DE NODE.JS
Una vez creada la BD, actualiza el archivo .env en el backend:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aquí
DB_NAME=api_banguat_tipocambio
DB_PORT=3306
```

## CREDENCIALES POR DEFECTO DE MARIADB
- Usuario: root
- Contraseña: (la que configuraste durante la instalación)
- Puerto: 3306 (por defecto)
- Host: localhost
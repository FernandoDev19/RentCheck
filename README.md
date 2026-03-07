# 🚗 RentCheck - MVP

**El "Datacrédito" de las rentadoras de vehículos**

**RentCheck** es una plataforma centralizada diseñada para que las rentadoras de vehículos puedan gestionar sus rentas y, lo más importante, consultar el **historial de comportamiento y score** de los clientes. Si un cliente es "mala paga" o maltrata los carros, aquí se sabe de una.

## 🏗️ Estructura del Proyecto

Este repositorio es un monorepo que contiene:

- `/backend`: API robusta construida con NestJS, TypeORM y PostgreSQL.

- `/frontend`: Interfaz moderna y rápida desarrollada con React, Vite y Tailwind CSS.

## 🚀 Tecnologías Principales

### Backend

- **NestJS**: Framework de Node.js para aplicaciones escalables.

- **PostgreSQL**: Base de datos relacional de alto rendimiento.

- **TypeORM**: ORM para el manejo eficiente de la DB y sus relaciones.

- **JWT & Bcrypt**: Para seguridad, roles y encriptación de claves.

### Frontend

- **React + Vite**: Para una experiencia de usuario fluida.

- **Tailwind CSS**: Estilizado moderno y responsivo.

- **SweetAlert2**: Modales interactivos y alertas de "avispado".

- **Axios**: Para la comunicación con la API.

## ⚙️ Configuración e Instalación

### 1. Requisitos previos

- **Node.js** (v18+)

- **Docker** (opcional, para la DB) o PostgreSQL instalado.

### 2. Clonar y preparar

```bash
git clone https://github.com/TU_USUARIO/rentcheck-mvp.git
cd rentcheck-mvp
```

### 3. Levantar el Backend

```bash
cd backend
npm install
# Configura tu .env con los datos de tu DB
npm run start:dev
```

### 4. Levantar el Frontend

```bash
cd ../frontend
npm install
npm run dev
```

## 🛠️ Funcionalidades Clave

- **Búsqueda Centralizada**: Consulta de clientes por cédula para ver su historial nacional.

- **Sistema de Scoring**: Calificación de clientes basada en daño al vehículo, multas, atrasos y actitud.

- **Jerarquía de Roles**:

    - **Owner**: Control total de su rentadora y todas sus sedes.

    - **Manager**: Gestiona una sede específica.

    - **Employee**: Operativo para crear rentas y registrar devoluciones.

- **Privacidad Comercial**: Las rentas activas en otras rentadoras son confidenciales; solo se comparte el historial final y el score.

- **Biometrías**: Registro y validación de identidad de los clientes.

## 🛡️ Seguridad y Optimización

- **Índices en DB**: Búsquedas optimizadas para grandes volúmenes de datos (probado con +100k registros).

- **Guards & Decorators**: Acceso restringido según el rol del usuario activo.

- **Ofuscación de Datos**: Protección de información operativa entre empresas competidoras.

## ✒️ Colaboradores

- **Fernando Cano** - Desarrollo Fullstack

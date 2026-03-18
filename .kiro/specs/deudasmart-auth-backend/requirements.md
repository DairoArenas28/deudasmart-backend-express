# Documento de Requerimientos

## Introducción

DeudaSmart es una aplicación orientada a jóvenes que desean mejorar su manejo financiero y crediticio. Este documento describe los requerimientos del backend del módulo de autenticación inicial, construido en Express con arquitectura de Modelos, Rutas, Controladores y Services, aplicando principios SOLID e inyección de dependencia. La base de datos es PostgreSQL gestionada con TypeORM, y la autenticación de peticiones se realiza mediante JWT.

El alcance de este documento cubre únicamente el requerimiento inicial: inicio de sesión con sus validaciones.

## Glosario

- **Auth_Service**: Servicio encargado de la lógica de autenticación, incluyendo validación de credenciales y generación de tokens.
- **Auth_Controller**: Controlador que recibe las peticiones HTTP del módulo de autenticación y delega la lógica al Auth_Service.
- **Auth_Router**: Enrutador Express que define los endpoints del módulo de autenticación.
- **User_Repository**: Abstracción de acceso a datos para la entidad User, implementada con TypeORM.
- **JWT_Service**: Servicio encargado de generar y verificar JSON Web Tokens.
- **Auth_Middleware**: Middleware Express que valida el JWT en las peticiones entrantes protegidas.
- **Validator**: Componente encargado de validar el formato y presencia de los campos de entrada en las peticiones.
- **User**: Entidad que representa a un usuario registrado en la tabla `users` de PostgreSQL.
- **Token**: JSON Web Token (JWT) generado tras una autenticación exitosa, usado para autorizar peticiones posteriores.

---

## Requerimientos

### Requerimiento 1: Inicio de Sesión

**User Story:** Como usuario registrado de DeudaSmart, quiero iniciar sesión con mi correo y contraseña, para que pueda acceder a las funcionalidades protegidas de la aplicación.

#### Criterios de Aceptación

1. WHEN el usuario envía una petición POST a `/api/auth/login` con un cuerpo JSON que contiene `email` y `password`, THE Auth_Controller SHALL delegar la solicitud al Auth_Service para procesar la autenticación.
2. WHEN el Auth_Service recibe las credenciales, THE Auth_Service SHALL consultar al User_Repository para buscar un User cuyo campo `email` coincida con el valor proporcionado.
3. WHEN el User_Repository encuentra un User con el email proporcionado, THE Auth_Service SHALL comparar el `password` proporcionado con el hash almacenado en la base de datos usando bcrypt.
4. WHEN la comparación de contraseña es exitosa, THE JWT_Service SHALL generar un Token firmado con el `userId` y `email` del User como payload, con una expiración de 24 horas.
5. WHEN el JWT_Service genera el Token exitosamente, THE Auth_Controller SHALL retornar una respuesta HTTP 200 con un cuerpo JSON que contenga el Token y los datos públicos del User (`userId`, `email`).

---

### Requerimiento 2: Validación de Entrada en Login

**User Story:** Como sistema, quiero validar los campos de entrada antes de procesar el login, para que las peticiones malformadas sean rechazadas antes de llegar a la lógica de negocio.

#### Criterios de Aceptación

1. WHEN la petición POST a `/api/auth/login` no contiene el campo `email`, THE Validator SHALL retornar una respuesta HTTP 400 con un mensaje de error que indique que el campo `email` es requerido.
2. WHEN la petición POST a `/api/auth/login` contiene un `email` con formato inválido (que no cumpla el patrón `[local]@[domain].[tld]`), THE Validator SHALL retornar una respuesta HTTP 400 con un mensaje de error que indique que el formato del `email` es inválido.
3. WHEN la petición POST a `/api/auth/login` no contiene el campo `password`, THE Validator SHALL retornar una respuesta HTTP 400 con un mensaje de error que indique que el campo `password` es requerido.
4. WHEN la petición POST a `/api/auth/login` contiene un `password` con menos de 8 caracteres, THE Validator SHALL retornar una respuesta HTTP 400 con un mensaje de error que indique que el `password` debe tener al menos 8 caracteres.

---

### Requerimiento 3: Manejo de Errores de Autenticación

**User Story:** Como sistema, quiero manejar los casos de credenciales inválidas o usuario inexistente, para que el cliente reciba respuestas claras sin exponer información sensible.

#### Criterios de Aceptación

1. IF el User_Repository no encuentra un User con el email proporcionado, THEN THE Auth_Service SHALL retornar un error de autenticación, y THE Auth_Controller SHALL responder con HTTP 401 y un mensaje genérico "Credenciales inválidas".
2. IF la comparación de contraseña falla, THEN THE Auth_Service SHALL retornar un error de autenticación, y THE Auth_Controller SHALL responder con HTTP 401 y un mensaje genérico "Credenciales inválidas".
3. IF ocurre un error inesperado durante la consulta al User_Repository, THEN THE Auth_Service SHALL propagar el error, y THE Auth_Controller SHALL responder con HTTP 500 y un mensaje genérico "Error interno del servidor".

---

### Requerimiento 4: Protección de Rutas con JWT

**User Story:** Como sistema, quiero validar el JWT en las peticiones entrantes a rutas protegidas, para que solo los usuarios autenticados puedan acceder a los recursos protegidos.

#### Criterios de Aceptación

1. WHEN una petición llega a una ruta protegida, THE Auth_Middleware SHALL verificar la presencia del header `Authorization` con el formato `Bearer <token>`.
2. IF el header `Authorization` está ausente en una petición a una ruta protegida, THEN THE Auth_Middleware SHALL retornar una respuesta HTTP 401 con un mensaje que indique que el token es requerido.
3. WHEN el Auth_Middleware extrae el Token del header, THE JWT_Service SHALL verificar la firma y la expiración del Token.
4. IF el Token tiene una firma inválida o ha expirado, THEN THE Auth_Middleware SHALL retornar una respuesta HTTP 401 con un mensaje que indique que el token es inválido o ha expirado.
5. WHEN el JWT_Service verifica el Token exitosamente, THE Auth_Middleware SHALL adjuntar el payload decodificado (`userId`, `email`) al objeto `request` y llamar al siguiente middleware.

---

### Requerimiento 5: Estructura de la Entidad User

**User Story:** Como sistema, quiero que la entidad User esté correctamente definida en TypeORM, para que la tabla `users` en PostgreSQL refleje la estructura necesaria para la autenticación.

#### Criterios de Aceptación

1. THE User_Repository SHALL mapear la entidad User a la tabla `users` en la base de datos PostgreSQL.
2. THE User SHALL contener los campos: `id` (UUID, clave primaria, generado automáticamente), `email` (string, único, no nulo), `password` (string, no nulo), `createdAt` (timestamp, generado automáticamente), `updatedAt` (timestamp, actualizado automáticamente).
3. WHEN se intenta insertar un User con un `email` que ya existe en la tabla `users`, THE User_Repository SHALL propagar el error de restricción de unicidad de la base de datos.

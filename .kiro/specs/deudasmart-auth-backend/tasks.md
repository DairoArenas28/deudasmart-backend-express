# Plan de Implementación: deudasmart-auth-backend

## Visión General

Implementación incremental del módulo de autenticación de DeudaSmart siguiendo el flujo de git definido en el diseño. Cada tarea corresponde a una feature branch independiente que se crea desde `develop`, se implementa, se commitea con el mensaje convencional definido y se hace push al repositorio remoto.

Repositorio: `https://github.com/DairoArenas28/deudasmart-backend-express.git`

## Tareas

- [-] 1. Setup: estructura del proyecto y configuración base
  - Crear rama `feature/setup-project-structure` desde `develop`
  - Inicializar proyecto Node.js con TypeScript (`tsconfig.json`, `package.json`)
  - Instalar dependencias: `express`, `typeorm`, `pg`, `bcrypt`, `jsonwebtoken`, `express-validator`, `dotenv`
  - Instalar dependencias de dev: `typescript`, `ts-node`, `jest`, `ts-jest`, `@types/*`, `fast-check`
  - Crear la estructura de carpetas: `src/modules/auth/`, `src/models/`, `src/repositories/`, `src/services/`, `src/config/`
  - Crear `src/config/database.ts` con la configuración del `DataSource` de TypeORM usando variables de entorno
  - Crear `src/app.ts` con la configuración base de Express (JSON middleware, montaje de rutas)
  - Crear `src/index.ts` como entry point que inicializa la conexión a DB y levanta el servidor
  - Crear `.env.example` con las variables requeridas: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`
  - Commit: `feat: initialize express app with TypeORM and project structure`
  - Push de la rama al repositorio remoto
  - _Requerimientos: 1.1, 5.1_

- [~] 2. Entidad User y repositorio
  - Crear rama `feature/user-entity-repository` desde `develop`
  - [~] 2.1 Crear la entidad `User` en `src/models/user.entity.ts`
    - Decoradores TypeORM: `@Entity('users')`, `@PrimaryGeneratedColumn('uuid')`, `@Column`, `@CreateDateColumn`, `@UpdateDateColumn`
    - Campos: `id`, `email` (unique, not null), `password` (not null), `createdAt`, `updatedAt`
    - _Requerimientos: 5.1, 5.2_
  - [~] 2.2 Crear la interfaz `IUserRepository` en `src/repositories/user.repository.interface.ts`
    - Método: `findByEmail(email: string): Promise<User | null>`
    - _Requerimientos: 1.2_
  - [~] 2.3 Implementar `UserRepository` en `src/repositories/user.repository.ts`
    - Implementa `IUserRepository` usando el `Repository<User>` de TypeORM
    - Inyectar el repositorio TypeORM en el constructor
    - _Requerimientos: 1.2, 5.1_
  - [~] 2.4 Escribir property test para la entidad User
    - **Propiedad 9: Entidad User contiene todos los campos requeridos**
    - **Valida: Requerimientos 5.1, 5.2**
    - Archivo: `src/modules/auth/__tests__/auth.service.spec.ts`
    - Generar instancias `User` con `fc.record` y verificar presencia y tipos de todos los campos
  - [~] 2.5 Escribir property test para email duplicado
    - **Propiedad 10: Email duplicado propaga error de unicidad**
    - **Valida: Requerimiento 5.3**
    - Simular inserción duplicada con repositorio mock y verificar que se propaga el error de unicidad
  - Commit: `feat: add User entity and IUserRepository with TypeORM implementation`
  - Push de la rama al repositorio remoto

- [~] 3. JWT Service
  - Crear rama `feature/jwt-service` desde `develop`
  - [~] 3.1 Crear la interfaz `IJwtService` en `src/services/jwt.service.interface.ts`
    - Métodos: `sign(payload: JwtPayload): string` y `verify(token: string): JwtPayload`
    - Definir la interfaz `JwtPayload` con campos `userId: string` y `email: string`
    - _Requerimientos: 1.4, 4.3_
  - [~] 3.2 Implementar `JwtService` en `src/services/jwt.service.ts`
    - Implementa `IJwtService` usando `jsonwebtoken`
    - `sign()` genera token con expiración `JWT_EXPIRES_IN` (24h) usando `JWT_SECRET` del entorno
    - `verify()` verifica firma y expiración, lanza error si el token es inválido o expirado
    - _Requerimientos: 1.4, 4.3, 4.4_
  - [~] 3.3 Escribir property test para round-trip de JWT
    - **Propiedad 1: Round-trip de JWT**
    - **Valida: Requerimientos 1.4, 4.5**
    - Archivo: `src/modules/auth/__tests__/jwt.service.spec.ts`
    - Usar `fc.record({ userId: fc.uuid(), email: fc.emailAddress() })` con 100 iteraciones
  - [~] 3.4 Escribir property test para token inválido
    - **Propiedad 7: Token inválido o expirado produce HTTP 401**
    - **Valida: Requerimiento 4.4**
    - Generar strings aleatorios como tokens y verificar que `verify()` lanza error
  - Commit: `feat: add IJwtService and JwtService for token sign/verify`
  - Push de la rama al repositorio remoto

- [~] 4. Checkpoint — Verificar que los tests de JWT y entidad pasan
  - Asegurarse de que todos los tests escritos hasta ahora pasan. Consultar al usuario si surgen dudas.

- [~] 5. Validador de entrada del login
  - Crear rama `feature/auth-validator` desde `develop`
  - [~] 5.1 Crear `src/modules/auth/auth.validator.ts`
    - Array de reglas `express-validator` para el endpoint de login
    - Validar presencia y formato de `email` (patrón `[local]@[domain].[tld]`)
    - Validar presencia y longitud mínima de `password` (≥ 8 caracteres)
    - Middleware final que lee `validationResult` y retorna HTTP 400 con los errores si los hay
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4_
  - [~] 5.2 Escribir property test para campos requeridos ausentes
    - **Propiedad 3: Campos requeridos ausentes producen HTTP 400**
    - **Valida: Requerimientos 2.1, 2.3**
    - Archivo: `src/modules/auth/__tests__/auth.validator.spec.ts`
    - Generar bodies sin `email` o sin `password` y verificar HTTP 400 con mensaje del campo faltante
  - [~] 5.3 Escribir property test para email con formato inválido
    - **Propiedad 4: Email con formato inválido produce HTTP 400**
    - **Valida: Requerimiento 2.2**
    - Usar `fc.string()` filtrado para excluir emails válidos y verificar HTTP 400
  - [~] 5.4 Escribir property test para password corto
    - **Propiedad 5: Password corto produce HTTP 400**
    - **Valida: Requerimiento 2.4**
    - Usar `fc.string({ maxLength: 7 })` y verificar HTTP 400 con mensaje de longitud mínima
  - Commit: `feat: add express-validator rules for login endpoint`
  - Push de la rama al repositorio remoto

- [~] 6. Auth Service — lógica de login
  - Crear rama `feature/auth-service-login` desde `develop`
  - [~] 6.1 Crear la interfaz `IAuthService` en `src/modules/auth/auth.service.interface.ts`
    - Método: `login(email: string, password: string): Promise<LoginResult>`
    - Definir `LoginResult` con campos `token: string` y `user: { userId: string; email: string }`
    - _Requerimientos: 1.1, 1.5_
  - [~] 6.2 Crear la clase `AuthError` en `src/modules/auth/auth.error.ts`
    - Extiende `Error`, recibe `message` y `statusCode` (default 401)
    - _Requerimientos: 3.1, 3.2_
  - [~] 6.3 Implementar `AuthService` en `src/modules/auth/auth.service.ts`
    - Implementa `IAuthService`
    - Inyectar `IUserRepository` y `IJwtService` en el constructor
    - `login()`: busca usuario por email, compara password con `bcrypt.compare`, genera token con `jwtService.sign`, retorna `LoginResult`
    - Lanza `AuthError("Credenciales inválidas")` si el usuario no existe o la contraseña no coincide
    - Propaga errores inesperados de la DB sin modificarlos
    - _Requerimientos: 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3_
  - [~] 6.4 Escribir property test para login exitoso
    - **Propiedad 2: Login exitoso retorna token y datos públicos**
    - **Valida: Requerimientos 1.2, 1.3, 1.4, 1.5**
    - Archivo: `src/modules/auth/__tests__/auth.service.spec.ts`
    - Generar usuario válido con repositorio mock, verificar que el resultado contiene `token` no vacío y `userId`/`email` sin exponer `password`
  - [~] 6.5 Escribir property test para credenciales inválidas
    - **Propiedad 6: Credenciales inválidas producen HTTP 401 con mensaje genérico**
    - **Valida: Requerimientos 3.1, 3.2**
    - Generar email inexistente o password incorrecto y verificar que `AuthService` lanza `AuthError` con mensaje `"Credenciales inválidas"`
  - Commit: `feat: implement AuthService login with bcrypt and JWT`
  - Push de la rama al repositorio remoto

- [~] 7. Auth Controller
  - Crear rama `feature/auth-controller` desde `develop`
  - [~] 7.1 Crear los DTOs en `src/modules/auth/dto/`
    - `login.request.dto.ts`: interfaz `LoginRequestDto` con `email` y `password`
    - `login.response.dto.ts`: interfaz `LoginResponseDto` con `token` y `user: { userId, email }`
    - _Requerimientos: 1.5_
  - [~] 7.2 Implementar `AuthController` en `src/modules/auth/auth.controller.ts`
    - Inyectar `IAuthService` en el constructor
    - Método `login(req, res)`: extrae `email` y `password` del body, llama a `authService.login()`, retorna HTTP 200 con `LoginResponseDto`
    - Captura `AuthError` y retorna HTTP 401 con mensaje genérico
    - Captura errores inesperados y retorna HTTP 500 con `"Error interno del servidor"`
    - _Requerimientos: 1.1, 1.5, 3.1, 3.2, 3.3_
  - [~] 7.3 Escribir tests unitarios para AuthController
    - Archivo: `src/modules/auth/__tests__/auth.controller.spec.ts`
    - Casos: login exitoso (HTTP 200), AuthError (HTTP 401), error inesperado (HTTP 500)
    - _Requerimientos: 1.5, 3.1, 3.2, 3.3_
  - Commit: `feat: add AuthController handling login HTTP request/response`
  - Push de la rama al repositorio remoto

- [~] 8. Auth Router
  - Crear rama `feature/auth-router` desde `develop`
  - [~] 8.1 Crear `src/modules/auth/auth.router.ts`
    - Instanciar `UserRepository`, `JwtService`, `AuthService` y `AuthController` con inyección de dependencias
    - Registrar la ruta `POST /login` con el array de validadores de `auth.validator.ts` y el método `login` del controlador
    - _Requerimientos: 1.1, 2.1, 2.2, 2.3, 2.4_
  - [~] 8.2 Montar el router en `src/app.ts` bajo el prefijo `/api/auth`
    - _Requerimientos: 1.1_
  - Commit: `feat: register auth routes with validator and controller`
  - Push de la rama al repositorio remoto

- [~] 9. Checkpoint — Verificar que todos los tests del módulo de auth pasan
  - Asegurarse de que todos los tests escritos hasta ahora pasan. Consultar al usuario si surgen dudas.

- [~] 10. Auth Middleware
  - Crear rama `feature/auth-middleware` desde `develop`
  - [~] 10.1 Implementar `AuthMiddleware` en `src/modules/auth/auth.middleware.ts`
    - Función middleware Express que extrae el Bearer token del header `Authorization`
    - Retorna HTTP 401 con `"Token requerido"` si el header está ausente
    - Llama a `jwtService.verify(token)`, adjunta el payload a `req.user` y llama a `next()`
    - Captura errores de `verify()` y retorna HTTP 401 con `"Token inválido o expirado"`
    - Inyectar `IJwtService` como parámetro de la función factory del middleware
    - _Requerimientos: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [~] 10.2 Escribir property test para token válido adjunta payload a req.user
    - **Propiedad 8: Token válido adjunta payload a req.user**
    - **Valida: Requerimiento 4.5**
    - Archivo: `src/modules/auth/__tests__/auth.middleware.spec.ts`
    - Generar payload `{userId, email}` → sign → middleware → verificar `req.user` igual al payload original
  - [~] 10.3 Escribir tests unitarios para AuthMiddleware
    - Casos: header ausente (HTTP 401), token inválido (HTTP 401), token válido (next() + req.user)
    - _Requerimientos: 4.1, 4.2, 4.3, 4.4, 4.5_
  - Commit: `feat: add AuthMiddleware for JWT-protected routes`
  - Push de la rama al repositorio remoto

- [~] 11. Checkpoint final — Todos los tests pasan
  - Ejecutar la suite completa de tests. Asegurarse de que todos los tests pasan. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea debe ejecutarse en su propia feature branch creada desde `develop`
- El flujo de merge es: `feature/* → develop → main` (PR por cada feature branch)
- Cada property test debe incluir el comentario: `// Feature: deudasmart-auth-backend, Property {N}: {texto}`
- Los mocks de repositorio y servicios se crean con Jest (`jest.fn()`) para aislar cada capa
- Las propiedades de fast-check deben ejecutarse con `{ numRuns: 100 }` como mínimo

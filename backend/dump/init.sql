-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db
-- Tiempo de generación: 09-06-2026 a las 20:30:29
-- Versión del servidor: 8.0.45
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Biblioteca`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Admin`
--

DROP TABLE IF EXISTS `Admin`;
CREATE TABLE `Admin` (
  `id_admin` int NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `Admin`
--

INSERT INTO `Admin` (`id_admin`, `usuario`, `contrasena`) VALUES
(1, 'admin@hotel.com', 'admin123'),
(2, 'gerente@hotel.com', 'gerente123'),
(3, 'empleado@hotel.com', 'empleado123');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id_admin` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `admin`
--

INSERT INTO `admin` (`id_admin`, `nombre`, `email`, `password_hash`, `estado`, `fecha_creacion`) VALUES
(1, 'Admin1', 'admin1@test.com', 'e738fb9d507439de56b7678bc9f3a3d4e167ca6fb2e8ea658a56a25c435db59f', 'activo', NULL),
(2, 'Admin2', 'admin2@test.com', 'c7a5c28deaba349c14b66b3d9fea9fbfd2d9b017faa252b16291e13df5d21d00', 'activo', NULL),
(3, 'Admin3', 'admin3@test.com', '1ebfbe0cfb73f955c0ec3ac393faa948de305b9788d8a6abca7039ff05084df6', 'activo', NULL),
(4, 'Admin4', 'admin4@test.com', '2985f2bd1294497f9cfb9bd5f70d006b3fa7d464fc8a35a1d01a5f58b2d1af59', 'activo', NULL),
(5, 'Admin5', 'admin@villa-lince.com', '2c61ff71c26f57984278b8bbfb6209cecab4b46d99b71b177078b326edd38216', 'activo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

DROP TABLE IF EXISTS `cliente`;
CREATE TABLE `cliente` (
  `id_cliente` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `tipo_cliente` varchar(50) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cliente`
--

INSERT INTO `cliente` (`id_cliente`, `nombre`, `apellido`, `telefono`, `email`, `tipo_cliente`, `fecha_registro`) VALUES
(1, 'Carlos', 'Ramirez', '5551111111', 'carlos@test.com', 'Frecuente', NULL),
(2, 'Laura', 'Hernandez', '5552222222', 'laura@test.com', 'Nuevo', NULL),
(3, 'Pedro', 'Martinez', '5553333333', 'pedro@test.com', 'Frecuente', NULL),
(4, 'Sofia', 'Gomez', '5554444444', 'sofia@test.com', 'Nuevo', NULL),
(6, 'Diego Saul Silva Baltazar', '', '3334892538', 'diegosaul370@gmail.com', 'Particular', '2026-05-27 21:17:23'),
(7, 'Juan Pérez', '', '3345436789', 'Juan@corportation.com', 'Ejecutivo', '2026-05-27 22:08:31'),
(8, 'Diego Saul Silva Baltazar', '', '3334892538', 'diegosaul370@gmail.com', 'Particular', '2026-05-27 23:43:19'),
(9, 'Jorge Sebastián Pérez', '', '3335025272', 'Jorgesebas12@hotmail.com', 'Particular', '2026-05-27 23:46:32'),
(10, 'Señor Barriga', '', '3312097823', 'señorbarriga72@outlook.com', 'Ejecutivo', '2026-05-28 00:18:07'),
(11, 'Juan Perez', '', '3334876521', 'ejemplo@example.com', 'Particular', '2026-06-04 01:56:11'),
(12, 'Armando Gerarde', '', '3321456789', 'ejemplo@example.com', 'Ejecutivo', '2026-06-04 01:57:58'),
(13, 'Carlos Segura', '', '3334567887', 'carloss@bimbo.com.mx', 'Ejecutivo', '2026-06-04 18:40:16'),
(14, 'Enrique Peña Nieto', '', '555 0000 555', 'Morena@bienestar.com', 'Ejecutivo', '2026-06-06 00:14:08'),
(15, 'Remmy Valenzuela ', '', '3312456765', 'Remmy12@gmail.com', 'Ejecutivo', '2026-06-06 00:33:50'),
(16, 'Checo Perez', '', '3312587643', 'ChecoP12@Formulauno.com', 'Ejecutivo', '2026-06-08 19:30:46'),
(17, 'Cristiano Ronaldo', '', '3312097865', 'Ronaldo329@gmail.com', 'Ejecutivo', '2026-06-08 21:09:46'),
(20, 'Orlando Gómez Martínez', '', '3312098976', 'OrlandoGomez234@gmail.com', 'Particular', '2026-06-09 01:41:58'),
(22, 'Monopolio Donoso Cruz', '', '3345097856', 'MonoDonoso34@outlook.com', 'Ejecutivo', '2026-06-09 01:55:12'),
(23, 'Carlos Rivera', '', '3315897645', 'CarlosV789@hotmail.com', 'Ejecutivo', '2026-06-09 02:01:21'),
(24, 'Jonathan Jesús Servin Delgado', '', '3334567689', 'JonathanJesusServinDelgado@gmail.com', 'Particular', '2026-06-09 02:19:32'),
(25, 'Lupita Rivera Hernandez', '', '3345067898', 'LupitaR230344@gmail.com', 'Particular', '2026-06-09 02:34:54'),
(26, 'Pedro Aranda Segura', '', '3312457689', 'PedroA82@gmail.com', 'Particular', '2026-06-09 02:37:54'),
(27, 'Alma Giesell Lopez', '', '3312096789', 'AlmaGiesell89@gmail.com', 'Particular', '2026-06-09 02:40:28'),
(28, 'Orlando Gómez Martínez', '', '3314149249', 'Orlando12@gmail.com', 'Particular', '2026-06-09 19:18:06'),
(29, 'Pedro Medina Jara', '', '3312456578', 'PedroJara@gmail.com', 'Particular', '2026-06-09 19:34:59'),
(30, 'Don Pedro José Donoso', '', '8001037809', 'PedroDonoso7332@hotmail.com', 'Ejecutivo', '2026-06-09 19:40:55'),
(31, 'Brayan Moran', '', '3312546789', 'bmoran83@gmail.com', 'Particular', '2026-06-09 19:57:53');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `convenio`
--

DROP TABLE IF EXISTS `convenio`;
CREATE TABLE `convenio` (
  `id_convenio` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `terminos` text,
  `descuento` decimal(5,2) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `convenio`
--

INSERT INTO `convenio` (`id_convenio`, `empresa_id`, `terminos`, `descuento`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
(1, 1, 'Convenio anual', 10.00, '2025-01-01', '2025-12-31', 1),
(4, 4, 'Convenio básico', 5.00, '2025-01-01', '2025-12-31', 1),
(5, 5, 'Convenio de 1 año con lo que respecta 2026-2027', 10.00, '2026-05-28', '2027-05-28', 1),
(6, 9, 'Tarifa preferencial ejecutiva', 15.00, '2026-06-04', '2027-06-04', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalles_huesped`
--

DROP TABLE IF EXISTS `detalles_huesped`;
CREATE TABLE `detalles_huesped` (
  `id_detalle` int NOT NULL,
  `reserva_id` int DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `personas` int DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `cargo` varchar(150) DEFAULT NULL,
  `rfc` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `detalles_huesped`
--

INSERT INTO `detalles_huesped` (`id_detalle`, `reserva_id`, `fecha_nacimiento`, `personas`, `telefono`, `email`, `cargo`, `rfc`) VALUES
(1, 6, '2004-01-11', 1, '3334892538', 'diegosaul370@gmail.com', '', ''),
(2, 7, '2002-12-12', 2, '3345436789', 'Juan@corportation.com', 'Jefe de Logistica', 'JUPAS111BK4'),
(3, 8, '2004-01-11', 3, '3334892538', 'diegosaul370@gmail.com', '', ''),
(4, 9, '2000-04-12', 2, '3335025272', 'Jorgesebas12@hotmail.com', '', ''),
(5, 10, '2001-12-12', 2, '3312097823', 'señorbarriga72@outlook.com', 'Dueño - Vecindad', 'SEBG41SGA1'),
(6, 11, '2004-11-11', 1, '3334876521', 'ejemplo@example.com', '', ''),
(7, 12, '2003-01-12', 2, '3321456789', 'ejemplo@example.com', 'Jefe', 'HDJS121BK'),
(8, 13, '1996-08-12', 2, '3334567887', 'carloss@bimbo.com.mx', 'Bimbo', 'BIMCAS09BK1'),
(9, 14, '1976-04-12', 2, '555 0000 555', 'Morena@bienestar.com', 'Gobernador', 'EPNJHG23HXS'),
(10, 15, '1984-04-12', 1, '3312456765', 'Remmy12@gmail.com', 'Servicios MX :: Jefe', 'RVEJHG78XS'),
(11, 16, '1990-02-12', 2, '3312587643', 'ChecoP12@Formulauno.com', 'Tech SA :: Piloto', 'CHPERE78BH1'),
(12, 17, '1989-08-03', 1, '3312097865', 'Ronaldo329@gmail.com', 'Tech SA :: Jugador Profesional', 'CR7BSK09BGA1'),
(14, 19, '2004-06-12', 1, '3312098976', 'OrlandoGomez234@gmail.com', '', ''),
(15, 21, '1965-08-23', 2, '3345097856', 'MonoDonoso34@outlook.com', 'Monopoly S.A :: Jefe de empresa', 'MPCTRHJ78JA1'),
(16, 22, '1985-12-09', 2, '3315897645', 'CarlosV789@hotmail.com', 'Bimbo S.A :: Artista', 'CRVHJ679FHGB6'),
(17, 23, '2003-12-09', 2, '3334567689', 'JonathanJesusServinDelgado@gmail.com', '', ''),
(18, 24, '2000-09-03', 5, '3345067898', 'LupitaR230344@gmail.com', '', ''),
(19, 25, '2003-08-09', 1, '3312457689', 'PedroA82@gmail.com', '', ''),
(20, 26, '2004-01-02', 2, '3312096789', 'AlmaGiesell89@gmail.com', '', ''),
(21, 27, NULL, 1, '3314149249', 'Orlando12@gmail.com', '', ''),
(22, 28, NULL, 2, '3312456578', 'PedroJara@gmail.com', '', ''),
(23, 29, NULL, 2, '8001037809', 'PedroDonoso7332@hotmail.com', 'Gerente regional', 'DPJEHUER453JHB2'),
(24, 30, '2004-01-09', 4, '3312546789', 'bmoran83@gmail.com', '', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleado`
--

DROP TABLE IF EXISTS `empleado`;
CREATE TABLE `empleado` (
  `id_empleado` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `rol` varchar(50) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `empleado`
--

INSERT INTO `empleado` (`id_empleado`, `nombre`, `apellido`, `email`, `password_hash`, `rol`, `estado`, `sucursal_id`, `fecha_creacion`) VALUES
(1, 'Juan', 'Perez', 'juan@test.com', 'af316ecb91a8ee7ae99210702b2d4758f30cdde3bf61e3d8e787d74681f90a6e', 'Recepcionista', 'activo', 1, NULL),
(2, 'Ana', 'Lopez', 'ana@test.com', 'e7bf382f6e5915b3f88619b866223ebf1d51c4c5321cccde2e9ff700a3259086', 'Gerente', 'activo', 2, NULL),
(3, 'Luis', 'Garcia', 'luis@test.com', '42caa4abb7b60f8f914e5bfb8e6511d7d9bd9817de719b74251755d97fe97bf1', 'Recepcionista', 'activo', 3, NULL),
(4, 'Maria', 'Torres', 'maria@test.com', '1c27099b3b84b13d0e3fbd299ba93ae7853ec1d0d3a4e5daa89e68b7ad59d7cb', 'Limpieza', 'activo', 4, NULL),
(5, 'Diego', 'Castañeda', 'empleado@villa-lince.com', 'ccc13e8ab0819e3ab61719de4071ecae6c1d3cd35dc48b91cad3481f20922f9f', 'Recepcionista', 'activo', 5, NULL),
(6, 'Carlos', 'Slim', 'gerente@villa-lince.com', 'a2172d68784d6750c645d1a08564c7359e5fa3d324a3fe94e6c43cf96b7ae309', 'Gerente', 'activo', 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresa`
--

DROP TABLE IF EXISTS `empresa`;
CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL,
  `nombre` varchar(150) DEFAULT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `empresa`
--

INSERT INTO `empresa` (`id_empresa`, `nombre`, `rfc`, `telefono`, `email`, `estado`) VALUES
(1, 'Tech SA', 'RFC123', '5512345678', 'tech@test.com', 'Activo'),
(2, 'Business Corp', 'RFC456', '5598765432', 'biz@test.com', 'Activo'),
(3, 'Global Inc', 'RFC789', '5587654321', 'global@test.com', 'Activo'),
(4, 'Servicios MX', 'RFC101', '5576543210', 'serv@test.com', 'Activo'),
(5, 'GrupoArcoirisPlásticos', 'POR_ASIGNAR', 'No registrado', 'No registrado', 'Activo'),
(9, 'Bimbo S.A', 'INV-120BE817', 'No registrado', 'No registrado', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

DROP TABLE IF EXISTS `factura`;
CREATE TABLE `factura` (
  `id_factura` int NOT NULL,
  `reserva_id` int DEFAULT NULL,
  `empresa_id` int DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `tipo_envio` varchar(50) DEFAULT NULL,
  `fecha_emision` datetime DEFAULT NULL,
  `generado_por_empleado` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_detalle`
--

DROP TABLE IF EXISTS `factura_detalle`;
CREATE TABLE `factura_detalle` (
  `id_detalle` int NOT NULL,
  `factura_id` int DEFAULT NULL,
  `servicio_id` int DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `factura_detalle`
--

INSERT INTO `factura_detalle` (`id_detalle`, `factura_id`, `servicio_id`, `subtotal`) VALUES
(1, 1, 1, 200.00),
(2, 2, 2, 150.00),
(3, 3, 3, 500.00),
(4, 4, 4, 300.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habitacion`
--

DROP TABLE IF EXISTS `habitacion`;
CREATE TABLE `habitacion` (
  `id_habitacion` int NOT NULL,
  `numero` int DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `precio_noche` decimal(10,2) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `estado_limpieza` varchar(50) DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `habitacion`
--

INSERT INTO `habitacion` (`id_habitacion`, `numero`, `tipo`, `precio_noche`, `estado`, `estado_limpieza`, `sucursal_id`) VALUES
(105, 101, 'Individual', 900.00, 'Ocupada', 'Limpia', 1),
(106, 102, 'Individual', 900.00, 'Ocupada', 'Limpia', 1),
(107, 103, 'Individual', 900.00, 'Ocupada', 'Limpia', 1),
(108, 104, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(109, 105, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(110, 106, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(111, 107, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(112, 108, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(113, 109, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(114, 110, 'Individual', 900.00, 'Disponible', 'Limpia', 1),
(115, 201, 'Doble', 1200.00, 'Ocupada', 'Limpia', 1),
(116, 202, 'Doble', 1200.00, 'Ocupada', 'Limpia', 1),
(117, 203, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(118, 204, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(119, 205, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(120, 206, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(121, 207, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(122, 208, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(123, 209, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(124, 210, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(125, 211, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(126, 212, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(127, 213, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(128, 214, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(129, 215, 'Doble', 1200.00, 'Disponible', 'Limpia', 1),
(130, 301, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(131, 302, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(132, 303, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(133, 304, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(134, 305, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(135, 306, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(136, 307, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(137, 308, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(138, 309, 'Matrimonial', 1400.00, 'Reservada', 'Limpia', 1),
(139, 310, 'Matrimonial', 1400.00, 'Disponible', 'Limpia', 1),
(140, 401, 'Ejecutiva', 1800.00, 'Ocupada', 'Limpia', 1),
(141, 402, 'Ejecutiva', 1800.00, 'Ocupada', 'Limpia', 1),
(142, 403, 'Ejecutiva', 1800.00, 'Ocupada', 'Limpia', 1),
(143, 404, 'Ejecutiva', 1800.00, 'Disponible', 'Limpia', 1),
(144, 405, 'Ejecutiva', 1800.00, 'Disponible', 'Limpia', 1),
(145, 406, 'Suite', 2800.00, 'Disponible', 'Limpia', 1),
(146, 407, 'Suite', 2800.00, 'Disponible', 'Limpia', 1),
(147, 408, 'Suite', 2800.00, 'Disponible', 'Limpia', 1),
(148, 409, 'Suite', 2800.00, 'Reservada', 'Limpia', 1),
(149, 410, 'Suite', 2800.00, 'Disponible', 'Limpia', 1),
(150, 411, 'Familiar', 3500.00, 'Ocupada', 'Limpia', 1),
(151, 412, 'Familiar', 3500.00, 'Disponible', 'Limpia', 1),
(152, 413, 'Familiar', 3500.00, 'Disponible', 'Limpia', 1),
(153, 414, 'Familiar', 3500.00, 'Disponible', 'Limpia', 1),
(154, 415, 'Familiar', 3500.00, 'Disponible', 'Limpia', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `huesped_empresarial`
--

DROP TABLE IF EXISTS `huesped_empresarial`;
CREATE TABLE `huesped_empresarial` (
  `id_huesped` int NOT NULL,
  `empresa_id` int DEFAULT NULL,
  `nombre` varchar(150) DEFAULT NULL,
  `fecha_llegada` date DEFAULT NULL,
  `fecha_salida` date DEFAULT NULL,
  `tipo_habitacion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `huesped_empresarial`
--

INSERT INTO `huesped_empresarial` (`id_huesped`, `empresa_id`, `nombre`, `fecha_llegada`, `fecha_salida`, `tipo_habitacion`) VALUES
(1, 1, 'Empleado A', '2025-04-01', '2025-04-05', 'Suite'),
(2, 2, 'Empleado B', '2025-04-02', '2025-04-06', 'Doble'),
(3, 3, 'Empleado C', '2025-04-03', '2025-04-07', 'Individual'),
(4, 4, 'Empleado D', '2025-04-04', '2025-04-08', 'Suite');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

DROP TABLE IF EXISTS `pago`;
CREATE TABLE `pago` (
  `id_pago` int NOT NULL,
  `reserva_id` int DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `estado_pago` varchar(50) DEFAULT NULL,
  `fecha_pago` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `pago`
--

INSERT INTO `pago` (`id_pago`, `reserva_id`, `monto`, `metodo_pago`, `estado_pago`, `fecha_pago`) VALUES
(1, 1, 2000.00, 'Tarjeta', 'Pagado', '2026-05-21 03:33:56'),
(2, 2, 3200.00, 'Efectivo', 'Pagado', '2026-05-21 03:33:56'),
(3, 3, 6000.00, 'Transferencia', 'Pendiente', '2026-05-21 03:33:56'),
(4, 4, 2000.00, 'Tarjeta', 'Pagado', '2026-05-21 03:33:56'),
(5, 13, 4046.00, 'Por definir', 'Pendiente', '2026-06-04 18:40:36'),
(6, 14, 7140.00, 'Tarjeta/Efectivo', 'Completado', '2026-06-06 00:14:30'),
(7, 15, 4522.00, 'Por definir', 'Pendiente', '2026-06-06 00:43:08'),
(8, 16, 4284.00, 'Por definir', 'Pendiente', '2026-06-08 19:31:03'),
(9, 17, 2142.00, 'Por definir', 'Pendiente', '2026-06-08 21:12:07'),
(11, 19, 900.00, 'Efectivo', 'Completado', '2026-06-09 01:41:58'),
(12, 21, 3600.00, 'Efectivo', 'Completado', '2026-06-09 01:55:12'),
(13, 22, 1530.00, 'Efectivo', 'Completado', '2026-06-09 02:01:21'),
(14, 23, 2400.00, 'Tarjeta (Bancaria - 0236)', 'Completado', '2026-06-09 02:19:32'),
(17, 24, 10500.00, 'Tarjeta (Bancaria - 0236)', 'Completado', '2026-06-09 02:34:54'),
(18, 25, 900.00, 'Tarjeta (Bancaria - 0236)', 'Completado', '2026-06-09 02:37:54'),
(19, 27, 927.00, 'Terminal POS (Bancaria (+3% vPOS))', 'Completado', '2026-06-09 19:18:07'),
(20, 28, 1260.00, 'Terminal POS (Bancaria (+5% vPOS))', 'Completado', '2026-06-09 19:34:59'),
(21, 29, 4590.00, 'Terminal POS (Bancaria (+0% vPOS))', 'Completado', '2026-06-09 19:40:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reporte`
--

DROP TABLE IF EXISTS `reporte`;
CREATE TABLE `reporte` (
  `id_reporte` int NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado_filtro` varchar(50) DEFAULT NULL,
  `generado_por_empleado` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `reporte`
--

INSERT INTO `reporte` (`id_reporte`, `tipo`, `fecha_inicio`, `fecha_fin`, `estado_filtro`, `generado_por_empleado`) VALUES
(1, 'Ventas', '2025-04-01', '2025-04-30', 'Pagado', 1),
(2, 'Reservas', '2025-04-01', '2025-04-30', 'Activa', 2),
(3, 'Servicios', '2025-04-01', '2025-04-30', 'Facturado', 3),
(4, 'General', '2025-04-01', '2025-04-30', 'Todos', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reserva`
--

DROP TABLE IF EXISTS `reserva`;
CREATE TABLE `reserva` (
  `id_reserva` int NOT NULL,
  `cliente_id` int DEFAULT NULL,
  `habitacion_id` int DEFAULT NULL,
  `empleado_id` int DEFAULT NULL,
  `sucursal_id` int DEFAULT NULL,
  `fecha_reserva` date DEFAULT NULL,
  `checkin` date DEFAULT NULL,
  `checkout` date DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `metodo_reserva` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `reserva`
--

INSERT INTO `reserva` (`id_reserva`, `cliente_id`, `habitacion_id`, `empleado_id`, `sucursal_id`, `fecha_reserva`, `checkin`, `checkout`, `estado`, `metodo_reserva`) VALUES
(19, 20, 105, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Activa', 'Mostrador'),
(21, 22, 140, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-11', 'Activa', 'Mostrador'),
(22, 23, 141, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Activa', 'Mostrador'),
(23, 24, 115, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-11', 'Activa', 'Mostrador'),
(24, 25, 150, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-12', 'Activa', 'Mostrador'),
(25, 26, 106, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Activa', 'Mostrador'),
(26, 27, 138, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Reservada', 'Mostrador'),
(27, 28, 107, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Activa', 'Mostrador'),
(28, 29, 116, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-10', 'Activa', 'Mostrador'),
(29, 30, 142, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-12', 'Activa', 'Mostrador'),
(30, 31, 148, NULL, 1, '2026-06-09', '2026-06-09', '2026-06-11', 'Reservada', 'Mostrador');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio`
--

DROP TABLE IF EXISTS `servicio`;
CREATE TABLE `servicio` (
  `id_servicio` int NOT NULL,
  `reserva_id` int DEFAULT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  `facturado` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `servicio`
--

INSERT INTO `servicio` (`id_servicio`, `reserva_id`, `descripcion`, `costo`, `facturado`) VALUES
(1, 1, 'Room Service', 200.00, 1),
(2, 2, 'Lavanderia', 150.00, 1),
(3, 3, 'Spa', 500.00, 0),
(4, 4, 'Transporte', 300.00, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sucursal`
--

DROP TABLE IF EXISTS `sucursal`;
CREATE TABLE `sucursal` (
  `id_sucursal` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `sucursal`
--

INSERT INTO `sucursal` (`id_sucursal`, `nombre`, `direccion`, `ciudad`, `telefono`) VALUES
(1, 'Sucursal Centro', 'Av. Juarez 123', 'CDMX', '5511111111'),
(2, 'Sucursal Norte', 'Av. Insurgentes 456', 'CDMX', '5522222222'),
(3, 'Sucursal Sur', 'Av. Tlalpan 789', 'CDMX', '5533333333'),
(4, 'Sucursal Poniente', 'Av. Reforma 101', 'CDMX', '5544444444'),
(5, 'Sucursal Este', 'Av. Constitucion 104', 'CDMX', '5551000001');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Admin`
--
ALTER TABLE `Admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Indices de la tabla `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `convenio`
--
ALTER TABLE `convenio`
  ADD PRIMARY KEY (`id_convenio`),
  ADD KEY `empresa_id` (`empresa_id`);

--
-- Indices de la tabla `detalles_huesped`
--
ALTER TABLE `detalles_huesped`
  ADD PRIMARY KEY (`id_detalle`),
  ADD UNIQUE KEY `reserva_id` (`reserva_id`);

--
-- Indices de la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD PRIMARY KEY (`id_empleado`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `sucursal_id` (`sucursal_id`);

--
-- Indices de la tabla `empresa`
--
ALTER TABLE `empresa`
  ADD PRIMARY KEY (`id_empresa`),
  ADD UNIQUE KEY `rfc` (`rfc`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`id_factura`),
  ADD UNIQUE KEY `reserva_id` (`reserva_id`),
  ADD KEY `empresa_id` (`empresa_id`),
  ADD KEY `generado_por_empleado` (`generado_por_empleado`);

--
-- Indices de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `factura_id` (`factura_id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `habitacion`
--
ALTER TABLE `habitacion`
  ADD PRIMARY KEY (`id_habitacion`),
  ADD KEY `sucursal_id` (`sucursal_id`);

--
-- Indices de la tabla `huesped_empresarial`
--
ALTER TABLE `huesped_empresarial`
  ADD PRIMARY KEY (`id_huesped`),
  ADD KEY `empresa_id` (`empresa_id`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`id_pago`),
  ADD UNIQUE KEY `reserva_id` (`reserva_id`);

--
-- Indices de la tabla `reporte`
--
ALTER TABLE `reporte`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `generado_por_empleado` (`generado_por_empleado`);

--
-- Indices de la tabla `reserva`
--
ALTER TABLE `reserva`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `habitacion_id` (`habitacion_id`),
  ADD KEY `empleado_id` (`empleado_id`),
  ADD KEY `sucursal_id` (`sucursal_id`);

--
-- Indices de la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD PRIMARY KEY (`id_servicio`),
  ADD KEY `reserva_id` (`reserva_id`);

--
-- Indices de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  ADD PRIMARY KEY (`id_sucursal`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Admin`
--
ALTER TABLE `Admin`
  MODIFY `id_admin` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id_cliente` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `convenio`
--
ALTER TABLE `convenio`
  MODIFY `id_convenio` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `detalles_huesped`
--
ALTER TABLE `detalles_huesped`
  MODIFY `id_detalle` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `empleado`
--
ALTER TABLE `empleado`
  MODIFY `id_empleado` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `empresa`
--
ALTER TABLE `empresa`
  MODIFY `id_empresa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `id_factura` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  MODIFY `id_detalle` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `habitacion`
--
ALTER TABLE `habitacion`
  MODIFY `id_habitacion` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=155;

--
-- AUTO_INCREMENT de la tabla `huesped_empresarial`
--
ALTER TABLE `huesped_empresarial`
  MODIFY `id_huesped` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `id_pago` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `reporte`
--
ALTER TABLE `reporte`
  MODIFY `id_reporte` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reserva`
--
ALTER TABLE `reserva`
  MODIFY `id_reserva` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `servicio`
--
ALTER TABLE `servicio`
  MODIFY `id_servicio` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sucursal`
--
ALTER TABLE `sucursal`
  MODIFY `id_sucursal` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `convenio`
--
ALTER TABLE `convenio`
  ADD CONSTRAINT `convenio_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id_empresa`);

--
-- Filtros para la tabla `detalles_huesped`
--
ALTER TABLE `detalles_huesped`
  ADD CONSTRAINT `detalles_huesped_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`);

--
-- Filtros para la tabla `empleado`
--
ALTER TABLE `empleado`
  ADD CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id_sucursal`);

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `factura_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`),
  ADD CONSTRAINT `factura_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id_empresa`),
  ADD CONSTRAINT `factura_ibfk_3` FOREIGN KEY (`generado_por_empleado`) REFERENCES `empleado` (`id_empleado`);

--
-- Filtros para la tabla `factura_detalle`
--
ALTER TABLE `factura_detalle`
  ADD CONSTRAINT `factura_detalle_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `factura` (`id_factura`),
  ADD CONSTRAINT `factura_detalle_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id_servicio`);

--
-- Filtros para la tabla `habitacion`
--
ALTER TABLE `habitacion`
  ADD CONSTRAINT `habitacion_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id_sucursal`);

--
-- Filtros para la tabla `huesped_empresarial`
--
ALTER TABLE `huesped_empresarial`
  ADD CONSTRAINT `huesped_empresarial_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id_empresa`);

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`);

--
-- Filtros para la tabla `reporte`
--
ALTER TABLE `reporte`
  ADD CONSTRAINT `reporte_ibfk_1` FOREIGN KEY (`generado_por_empleado`) REFERENCES `empleado` (`id_empleado`);

--
-- Filtros para la tabla `reserva`
--
ALTER TABLE `reserva`
  ADD CONSTRAINT `reserva_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`),
  ADD CONSTRAINT `reserva_ibfk_2` FOREIGN KEY (`habitacion_id`) REFERENCES `habitacion` (`id_habitacion`),
  ADD CONSTRAINT `reserva_ibfk_3` FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id_empleado`),
  ADD CONSTRAINT `reserva_ibfk_4` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursal` (`id_sucursal`);

--
-- Filtros para la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD CONSTRAINT `servicio_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`id_reserva`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

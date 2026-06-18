-- Insertar las 3 facturas simuladas
INSERT INTO factura (id_factura, reserva_id, empresa_id, total, estado, tipo_envio, fecha_emision, generado_por_empleado) VALUES
(12, 31, NULL,  12495.00, 'Pagada',   'DIGITAL', '2026-06-18 11:35:00', 5),
(13, 22, 9,      2400.00, 'Pendiente', 'DIGITAL', '2026-06-09 02:25:00', 1),
(14, 24, NULL,  10500.00, 'Pagada',   'DIGITAL', '2026-06-09 02:40:00', 1);

-- Actualizar AUTO_INCREMENT
ALTER TABLE factura MODIFY id_factura int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 15;
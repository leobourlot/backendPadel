import { MigrationInterface, QueryRunner } from "typeorm";

export class DropClubsLegacyTable1786100000000 implements MigrationInterface {
    name = 'DropClubsLegacyTable1786100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`clubs\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`clubs\` (
                \`idClub\` int(11) NOT NULL AUTO_INCREMENT,
                \`slug\` varchar(100) NOT NULL,
                \`nombre\` varchar(150) NOT NULL,
                \`emailContacto\` varchar(100) DEFAULT NULL,
                \`telefono\` varchar(20) DEFAULT NULL,
                \`activo\` tinyint(4) NOT NULL DEFAULT 1,
                \`pagado\` tinyint(4) NOT NULL DEFAULT 0,
                \`fechaInicioPrueba\` date DEFAULT NULL,
                \`fechaFinPrueba\` date DEFAULT NULL,
                \`fechaCreacion\` datetime(6) NOT NULL DEFAULT current_timestamp(6),
                \`fechaActualizacion\` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
                PRIMARY KEY (\`idClub\`),
                UNIQUE KEY \`IDX_11a81774605896dbb29c9e5360\` (\`slug\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }
}
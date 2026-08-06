import { MigrationInterface, QueryRunner } from "typeorm";

export class Baseline1786058305147 implements MigrationInterface {
    name = 'Baseline1786058305147'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`emailContacto\` \`emailContacto\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`telefono\` \`telefono\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`direccion\` \`direccion\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`facebookUrl\` \`facebookUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`instagramUrl\` \`instagramUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`twitterUrl\` \`twitterUrl\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`horarioSemana\` \`horarioSemana\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`horarioFinde\` \`horarioFinde\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`fechaInicioPrueba\` \`fechaInicioPrueba\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`fechaFinPrueba\` \`fechaFinPrueba\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`mercadopagoAccessToken\` \`mercadopagoAccessToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`precioReserva\` \`precioReserva\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`canchas\` CHANGE \`descripcion\` \`descripcion\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`idPagoMercadoPago\` \`idPagoMercadoPago\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`montoPagado\` \`montoPagado\` decimal(10,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`metodoPago\` \`metodoPago\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_c09370b22c36da2122b54a102a5\``);
        await queryRunner.query(`DROP INDEX \`IDX_bbfcb033ad54b0d077fc19e1fd\` ON \`usuarios\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e1d0df3ea3fb8e6247d3084bc\` ON \`usuarios\``);
        await queryRunner.query(`ALTER TABLE \`usuarios\` CHANGE \`idClub\` \`idClub\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`reservas_recurrentes\` CHANGE \`fechaFin\` \`fechaFin\` date NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_bbfcb033ad54b0d077fc19e1fd\` ON \`usuarios\` (\`email\`, \`idClub\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_6e1d0df3ea3fb8e6247d3084bc\` ON \`usuarios\` (\`dni\`, \`idClub\`)`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_c09370b22c36da2122b54a102a5\` FOREIGN KEY (\`idClub\`) REFERENCES \`clubes\`(\`idClub\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuarios\` DROP FOREIGN KEY \`FK_c09370b22c36da2122b54a102a5\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e1d0df3ea3fb8e6247d3084bc\` ON \`usuarios\``);
        await queryRunner.query(`DROP INDEX \`IDX_bbfcb033ad54b0d077fc19e1fd\` ON \`usuarios\``);
        await queryRunner.query(`ALTER TABLE \`reservas_recurrentes\` CHANGE \`fechaFin\` \`fechaFin\` date NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` CHANGE \`idClub\` \`idClub\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_6e1d0df3ea3fb8e6247d3084bc\` ON \`usuarios\` (\`dni\`, \`idClub\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_bbfcb033ad54b0d077fc19e1fd\` ON \`usuarios\` (\`email\`, \`idClub\`)`);
        await queryRunner.query(`ALTER TABLE \`usuarios\` ADD CONSTRAINT \`FK_c09370b22c36da2122b54a102a5\` FOREIGN KEY (\`idClub\`) REFERENCES \`clubes\`(\`idClub\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`metodoPago\` \`metodoPago\` varchar(20) COLLATE "utf8mb4_general_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`montoPagado\` \`montoPagado\` decimal(10,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`reservas\` CHANGE \`idPagoMercadoPago\` \`idPagoMercadoPago\` varchar(100) COLLATE "utf8mb4_general_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`canchas\` CHANGE \`descripcion\` \`descripcion\` text COLLATE "utf8mb4_general_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`precioReserva\` \`precioReserva\` decimal(10,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`mercadopagoAccessToken\` \`mercadopagoAccessToken\` varchar(255) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`fechaFinPrueba\` \`fechaFinPrueba\` date NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`fechaInicioPrueba\` \`fechaInicioPrueba\` date NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`horarioFinde\` \`horarioFinde\` varchar(100) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`horarioSemana\` \`horarioSemana\` varchar(100) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`twitterUrl\` \`twitterUrl\` varchar(255) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`instagramUrl\` \`instagramUrl\` varchar(255) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`facebookUrl\` \`facebookUrl\` varchar(255) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`direccion\` \`direccion\` varchar(255) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`telefono\` \`telefono\` varchar(20) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`clubes\` CHANGE \`emailContacto\` \`emailContacto\` varchar(100) COLLATE "utf8mb4_uca1400_ai_ci" NULL DEFAULT 'NULL'`);
    }

}

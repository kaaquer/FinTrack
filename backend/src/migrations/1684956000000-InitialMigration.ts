import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1684956000000 implements MigrationInterface {
    name = 'InitialMigration1684956000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "customer" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar NOT NULL,
                "contact" varchar NOT NULL,
                "address" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('Lead'),
                "totalSpent" decimal DEFAULT (0),
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "customer"`);
    }
}

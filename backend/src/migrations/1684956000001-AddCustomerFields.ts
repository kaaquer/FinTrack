import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerFields1684956000001 implements MigrationInterface {
    name = 'AddCustomerFields1684956000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "customer" ADD COLUMN "lastTransaction" datetime;
            ALTER TABLE "customer" ADD COLUMN "email" varchar;
            ALTER TABLE "customer" ADD COLUMN "phone" varchar;
            ALTER TABLE "customer" ADD COLUMN "company" varchar;
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "idx_customer_name" ON "customer" ("name")`);
        await queryRunner.query(`CREATE INDEX "idx_customer_email" ON "customer" ("email")`);
        await queryRunner.query(`CREATE INDEX "idx_customer_status" ON "customer" ("status")`);
        await queryRunner.query(`CREATE INDEX "idx_customer_created_at" ON "customer" ("createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "idx_customer_created_at"`);
        await queryRunner.query(`DROP INDEX "idx_customer_status"`);
        await queryRunner.query(`DROP INDEX "idx_customer_email"`);
        await queryRunner.query(`DROP INDEX "idx_customer_name"`);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "customer" DROP COLUMN "company";
            ALTER TABLE "customer" DROP COLUMN "phone";
            ALTER TABLE "customer" DROP COLUMN "email";
            ALTER TABLE "customer" DROP COLUMN "lastTransaction";
        `);
    }
}

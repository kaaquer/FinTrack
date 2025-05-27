import { DataSource } from 'typeorm';
import path from 'path';
import { Customer } from '../models/customer.model';

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, '../../database.sqlite'),
    entities: [Customer],
    migrations: [path.join(__dirname, '../migrations/*.ts')],
    synchronize: false, // Disable synchronize in favor of migrations
    logging: true
});

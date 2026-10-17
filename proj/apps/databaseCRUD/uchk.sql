select t.name, tc.constraint_type
from uc_table as t
 join information_schema.table_constraints as tc 
    on tc.table_name = t.db_table_name
        join information_schema.constraint_column_usage as ccu
            on tc.constraint_name = ccu.constraint_name
where t.table_type = 'independent' and ccu.column_name = 'name';
    
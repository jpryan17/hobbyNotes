import * as api from '../../clientLib/db/api.js';

export async function browserUtil() {
    const ids = await api.queryDatabase('select id from curriculum_nav_items')
    for
    return ids;
}
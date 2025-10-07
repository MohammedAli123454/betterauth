import { db } from '../db';
import { user, account } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

async function cleanupInvalidUsers() {
  try {
    // Delete accounts associated with these users first (foreign key constraint)
    const usersToDelete = await db
      .select()
      .from(user)
      .where(inArray(user.email, ['ali@gmail.com', 'abbas@gmail.com']));

    if (usersToDelete.length === 0) {
      console.log('No invalid users found to cleanup');
      return;
    }

    const userIds = usersToDelete.map((u) => u.id);

    // Delete associated accounts first
    await db.delete(account).where(inArray(account.userId, userIds));
    console.log(`Deleted ${usersToDelete.length} associated accounts`);

    // Delete the users
    await db.delete(user).where(inArray(user.id, userIds));
    console.log(`Deleted ${usersToDelete.length} users with invalid password hashes`);
    console.log('Users deleted:', usersToDelete.map((u) => u.email).join(', '));
    console.log('\nThese users can now be recreated by the admin via the admin panel.');
  } catch (error) {
    console.error('Error cleaning up users:', error);
  } finally {
    process.exit(0);
  }
}

cleanupInvalidUsers();

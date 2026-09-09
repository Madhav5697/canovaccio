/**
 * Tests for the RoomManager class.
 * We test room creation, joining, isolation, and history management.
 */

// We need to import RoomManager as a class for testing, not the singleton
// Let's re-export a test factory from the module pattern
import { v4 as uuidv4 } from 'uuid';

// Because roomManager is a singleton, we test its methods directly
// In a real test suite, we'd refactor to allow fresh instances
// For now we test the core behaviors in sequence

describe('Room Management', () => {
  // Since roomManager is a singleton, let's test it in a controlled way
  let testRoomId: string;
  const socket1 = 'socket-test-001';
  const socket2 = 'socket-test-002';
  const user1Id = 'user-test-001';
  const user2Id = 'user-test-002';

  // We import after describing to avoid module caching issues
  let roomManager: typeof import('../rooms/roomManager').roomManager;

  beforeAll(async () => {
    const mod = await import('../rooms/roomManager');
    roomManager = mod.roomManager;
  });

  afterAll(() => {
    roomManager?.destroy();
  });

  test('should create a new room with a valid 6-character ID', () => {
    const room = roomManager.createRoom();
    testRoomId = room.id;

    expect(room.id).toMatch(/^[A-Z0-9]{6}$/);
    expect(room.users.size).toBe(0);
    expect(room.drawingHistory).toEqual([]);
    expect(typeof room.createdAt).toBe('number');
  });

  test('should confirm the created room exists', () => {
    expect(roomManager.roomExists(testRoomId)).toBe(true);
    expect(roomManager.roomExists('XXXXXX')).toBe(false);
  });

  test('should add a user to the room', () => {
    const user = roomManager.addUserToRoom(testRoomId, socket1, user1Id);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(user1Id);
    expect(user?.socketId).toBe(socket1);
    expect(typeof user?.color).toBe('string');
    expect(user?.roomId).toBe(testRoomId);
  });

  test('should add a second user to the same room', () => {
    const user = roomManager.addUserToRoom(testRoomId, socket2, user2Id);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(user2Id);

    // Second user should get a different color
    const users = roomManager.getRoomUsers(testRoomId);
    expect(users.length).toBe(2);
    expect(users[0].color).not.toBe(users[1].color);
  });

  test('should return null when adding user to non-existent room', () => {
    const result = roomManager.addUserToRoom('NONEXISTENT', 'socket-x', 'user-x');
    expect(result).toBeNull();
  });

  test('should store draw events in room history (only draw_end)', () => {
    const strokeId = uuidv4();

    const startEvent = {
      type: 'draw_start' as const,
      tool: 'pencil' as const,
      color: '#FF0000',
      brushSize: 5,
      points: [{ x: 10, y: 10 }],
      userId: user1Id,
      timestamp: Date.now(),
      strokeId,
    };

    const endEvent = {
      ...startEvent,
      type: 'draw_end' as const,
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
    };

    roomManager.addDrawEvent(testRoomId, startEvent);
    // draw_start should NOT be stored
    expect(roomManager.getDrawingHistory(testRoomId).length).toBe(0);

    roomManager.addDrawEvent(testRoomId, endEvent);
    // draw_end SHOULD be stored
    expect(roomManager.getDrawingHistory(testRoomId).length).toBe(1);
  });

  test('should clear room canvas history', () => {
    roomManager.clearRoomCanvas(testRoomId, user1Id);
    expect(roomManager.getDrawingHistory(testRoomId).length).toBe(0);
  });

  test('should remove user from room on disconnect', () => {
    const result = roomManager.removeUserFromRoom(socket1);

    expect(result).not.toBeNull();
    expect(result?.roomId).toBe(testRoomId);

    const users = roomManager.getRoomUsers(testRoomId);
    expect(users.length).toBe(1);
    expect(users[0].id).toBe(user2Id);
  });

  test('should return null when removing a socket not in any room', () => {
    const result = roomManager.removeUserFromRoom('socket-not-in-any-room');
    expect(result).toBeNull();
  });

  test('should isolate rooms from each other', () => {
    const room1 = roomManager.createRoom();
    const room2 = roomManager.createRoom();

    roomManager.addUserToRoom(room1.id, 'socket-r1-u1', 'user-r1');
    roomManager.addUserToRoom(room2.id, 'socket-r2-u1', 'user-r2');

    const room1StrokeId = uuidv4();
    roomManager.addDrawEvent(room1.id, {
      type: 'draw_end',
      tool: 'pencil',
      color: '#00FF00',
      brushSize: 3,
      points: [{ x: 5, y: 5 }],
      userId: 'user-r1',
      timestamp: Date.now(),
      strokeId: room1StrokeId,
    });

    // Room 2 should have no history
    expect(roomManager.getDrawingHistory(room2.id).length).toBe(0);
    // Room 1 should have the event
    expect(roomManager.getDrawingHistory(room1.id).length).toBe(1);

    // Users should also be isolated
    expect(roomManager.getRoomUsers(room1.id).length).toBe(1);
    expect(roomManager.getRoomUsers(room2.id).length).toBe(1);
    expect(roomManager.getRoomUsers(room1.id)[0].id).toBe('user-r1');
    expect(roomManager.getRoomUsers(room2.id)[0].id).toBe('user-r2');
  });
});

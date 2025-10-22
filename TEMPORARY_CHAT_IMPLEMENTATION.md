# Temporary Chat Implementation

## Overview
Implemented a new chat creation flow where clicking the + button creates a temporary chat that only persists to the backend when the user sends their first message.

## Changes Made

### 1. `frontend/src/hooks/useChats.ts`

#### New State
- Added `isTemporaryChat` state to track if the current chat is temporary

#### New Function: `createTemporaryChat()`
- Creates a local-only chat session with ID prefix "temp_"
- Sets `isTemporaryChat` to true
- Does NOT call the backend API

#### Modified Function: `createNewChat()`
- Now returns the created chat object
- Sets `isTemporaryChat` to false
- Can throw errors for proper error handling

#### Modified Function: `handleSendMessage()`
- Checks if current chat is temporary before sending
- If temporary:
  1. Calls `createNewChat()` to create real chat in backend
  2. Removes temporary chat from local state
  3. Adds optimistic message to the new real chat
  4. Sends the message to the backend
- If not temporary, proceeds with normal flow

#### Modified Function: `handleDeleteChat()`
- Checks if chat ID starts with "temp_"
- If temporary: Only removes from local state (no backend call)
- If real: Calls backend API to delete
- Updates `isTemporaryChat` state when switching to remaining chats

#### Modified Function: `switchToChat()`
- Updates `isTemporaryChat` state based on whether the chat ID starts with "temp_"

#### Exported Values
- Added `isTemporaryChat` and `createTemporaryChat` to return object

### 2. `frontend/src/components/chat/ChatView.tsx`

#### Changes
- Destructured `createTemporaryChat` from `useChats` hook
- Removed unused `createNewChat` import
- Passed `createTemporaryChat` to Layout component as `createNewChat` prop

## User Flow

### Before (Old Flow)
1. User clicks + button
2. `createNewChat()` is called immediately
3. Backend creates a new chat with thread_id
4. User can then send messages

### After (New Flow)
1. User clicks + button
2. `createTemporaryChat()` is called
3. A temporary chat appears in the sidebar (ID: "temp_[timestamp]")
4. User types and sends first message
5. `handleSendMessage()` detects temporary chat
6. Backend creates real chat via `createNewChat()`
7. Temporary chat is removed from sidebar
8. Message is sent to the new real chat
9. Subsequent messages work normally

## Benefits

1. **Reduced Backend Load**: No chat is created until user actually sends a message
2. **Better UX**: Users can create multiple temporary chats and only the ones they use persist
3. **Clean State**: Temporary chats can be deleted without backend calls
4. **Seamless Transition**: User doesn't notice the switch from temporary to real chat

## Edge Cases Handled

1. **Deleting Temporary Chat**: Only removes from local state, no backend call
2. **Switching Between Chats**: Properly tracks temporary state
3. **Error Handling**: If chat creation fails, temporary chat remains and user can retry
4. **Multiple Temporary Chats**: Each gets unique ID with timestamp

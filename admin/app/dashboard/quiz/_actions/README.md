# Quiz Administration System

## Overview
This module implements the Quiz Administration section with full CRUD operations, bulk question uploads, and curriculum-based assignment management.

## Architecture

### Directory Structure
```
src/app/admin/quizzes/
├── page.tsx                          # Main dashboard with Tabs
├── _components/
│   ├── quiz-table.tsx                # Data table with filters & checkboxes
│   ├── quiz-dialog.tsx              # Creation modal with JSON upload
│   └── curriculum-select.tsx        # Cascading Grade→Subject→Content→Subcontent
└── _actions/
    └── quiz-actions.ts               # Server Actions for Prisma operations
```

### Key Features

1. **Quiz Table** (`quiz-table.tsx`)
   - TanStack Query for data fetching
   - Checkbox selection with shared state (`selectedQuizIds`)
   - Synchronous filtering by title and curriculum hierarchy
   - Selection summary bar

2. **Quiz Dialog** (`quiz-dialog.tsx`)
   - Form fields: title, is_general toggle
   - JSON file dropzone using FileReader API
   - Client-side mapping: `correct_answer_index` → actual option text
   - Live preview with image placeholders for `question_image` and `option_image`
   - Media support: passes `question_image` and `option_image` through to JSONB

3. **Curriculum Select** (`curriculum-select.tsx`)
   - Cascading dropdowns (Grade → Subject → Content → Subcontent)
   - Fetches children based on parent selection
   - Optional selection at each level

4. **Server Actions** (`quiz-actions.ts`)
   - `createQuizWithQuestions()`: Insert quiz + bulk create questions
   - `bulkAssignQuizzes()`: Upsert quiz_assignments with duplicate handling
   - `getFilteredQuizzes()`: Server-side filtering with relations
   - `getCurriculumTree()`: Fetches full curriculum hierarchy

### Backend Integration
- New endpoints at `/api/v1/admin/quiz-assignments/bulk` and `/filter`
- Uses Prisma upsert to gracefully skip duplicates
- NULL-safe unique constraint handling for assignments

## Data Flow

### Quiz Creation Pipeline
1. Admin selects JSON file → FileReader parses
2. Client maps `correct_answer_index` to option text
3. Server Action inserts Quiz, captures UUID
4. Bulk `createMany` for questions

### Bulk Assignment
1. Admin selects quizzes via checkboxes
2. Selects curriculum node (Grade → ... → Subcontent)
3. Server Action upserts assignments per quiz

## Media Support
- `question_image`: Root property in JSON → mapped to `question_image` column
- `option_image`: Inside options array → saved within JSONB structure
- Preview shows placeholder frames when images present
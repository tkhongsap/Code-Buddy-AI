// Mock data for the dashboard
export const mockDashboardData = {
  stats: {
    totalQueries: 156,
    savedSolutions: 47,
    activeCourses: 3,
    skillProgress: 72
  },
  weeklyActivity: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [5, 8, 12, 7, 15, 9, 3]
  },
  recentQueries: [
    { 
      id: 1, 
      query: 'How to implement a React useEffect hook with cleanup', 
      timestamp: '2h ago',
      responseTimestamp: '2h ago',
      aiResponse: `To implement a React useEffect hook with cleanup, you need to return a cleanup function from your effect:

\`\`\`jsx
useEffect(() => {
  // Effect code here
  console.log('Effect running');
  const subscription = someAPI.subscribe();
  
  // Return a cleanup function
  return () => {
    console.log('Cleanup running');
    subscription.unsubscribe();
  };
}, [dependencies]);
\`\`\`

The cleanup function runs:
- Before the component unmounts
- Before the effect runs again if dependencies change

This pattern is essential for preventing memory leaks when working with subscriptions, event listeners, or timers.`,
      tags: ['React', 'Hooks'],
      sessionId: 1,
      conversation: [
        {
          id: 101,
          sender: 'user',
          content: 'How to implement a React useEffect hook with cleanup',
          timestamp: '2h ago'
        },
        {
          id: 102,
          sender: 'ai',
          content: `To implement a React useEffect hook with cleanup, you need to return a cleanup function from your effect:

\`\`\`jsx
useEffect(() => {
  // Effect code here
  console.log('Effect running');
  const subscription = someAPI.subscribe();
  
  // Return a cleanup function
  return () => {
    console.log('Cleanup running');
    subscription.unsubscribe();
  };
}, [dependencies]);
\`\`\`

The cleanup function runs:
- Before the component unmounts
- Before the effect runs again if dependencies change

This pattern is essential for preventing memory leaks when working with subscriptions, event listeners, or timers.`,
          timestamp: '2h ago'
        },
        {
          id: 103,
          sender: 'user',
          content: 'Can you provide a practical example with a real API?',
          timestamp: '2h ago'
        },
        {
          id: 104,
          sender: 'ai',
          content: `Here's a practical example using event listeners:

\`\`\`jsx
import React, { useState, useEffect } from 'react';

function WindowResizeTracker() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    // Function to update state on window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Return cleanup function
    return () => {
      // Remove event listener
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array means it runs once on mount
  
  return (
    <div>
      <p>Current window width: {windowWidth}px</p>
    </div>
  );
}

export default WindowResizeTracker;
\`\`\`

And here's another example with a subscription to an interval:

\`\`\`jsx
import React, { useState, useEffect } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);
    
    // Cleanup function to clear interval
    return () => clearInterval(intervalId);
  }, []);
  
  return <p>Timer: {seconds} seconds</p>;
}

export default Timer;
\`\`\`

These examples demonstrate the importance of cleanup:
1. Without cleanup in the window resize example, new event listeners would be added each time the component re-renders, causing memory leaks
2. Without cleanup in the timer example, multiple intervals would run even after the component unmounts`,
          timestamp: '2h ago'
        }
      ]
    },
    { 
      id: 2, 
      query: 'Best practices for TypeScript interfaces vs types', 
      timestamp: '5h ago',
      responseTimestamp: '5h ago',
      aiResponse: `Both TypeScript interfaces and types can define object shapes, but they have key differences:

**Interfaces:**
- Can be extended with 'extends'
- Can be merged when redeclared
- Better for public APIs
- More aligned with OOP principles

**Types:**
- Can use unions and intersections
- Can create mapped types
- More flexible for complex type manipulations
- Can represent primitives directly

General recommendation:
- Use interfaces for public API objects and classes
- Use types for unions, tuples, and complex transformations
- Prefer interfaces until you need type-specific features

Example of each:
\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
}

// Type
type UserOrAdmin = User | { id: number; permissions: string[] };
\`\`\``,
      tags: ['TypeScript'],
      sessionId: 2,
      conversation: [
        {
          id: 201,
          sender: 'user',
          content: 'Best practices for TypeScript interfaces vs types',
          timestamp: '5h ago'
        },
        {
          id: 202,
          sender: 'ai',
          content: `Both TypeScript interfaces and types can define object shapes, but they have key differences:

**Interfaces:**
- Can be extended with 'extends'
- Can be merged when redeclared
- Better for public APIs
- More aligned with OOP principles

**Types:**
- Can use unions and intersections
- Can create mapped types
- More flexible for complex type manipulations
- Can represent primitives directly

General recommendation:
- Use interfaces for public API objects and classes
- Use types for unions, tuples, and complex transformations
- Prefer interfaces until you need type-specific features

Example of each:
\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
}

// Type
type UserOrAdmin = User | { id: number; permissions: string[] };
\`\`\``,
          timestamp: '5h ago'
        },
        {
          id: 203,
          sender: 'user',
          content: 'How do declaration merging and union types differ in practice?',
          timestamp: '5h ago'
        },
        {
          id: 204,
          sender: 'ai',
          content: `# Declaration Merging vs Union Types

## Declaration Merging (Interfaces)

Declaration merging allows you to add new fields to an existing interface:

\`\`\`typescript
// First declaration
interface User {
  id: number;
  name: string;
}

// Merged declaration - adds email field
interface User {
  email: string;
}

// Result: User has all three properties
const user: User = {
  id: 1,
  name: "John",
  email: "john@example.com"
  // All properties required
};
\`\`\`

This is useful for:
- Augmenting third-party types
- Progressive enhancement of APIs
- Module augmentation

## Union Types

Union types represent values that could be one of several types:

\`\`\`typescript
// Define separate types
type Admin = {
  id: number;
  name: string;
  permissions: string[];
};

type Customer = {
  id: number;
  name: string;
  billingInfo: string;
};

// Create a union type
type SystemUser = Admin | Customer;

function processUser(user: SystemUser) {
  // Common properties accessible directly
  console.log(user.id, user.name);
  
  // Type-specific properties require narrowing
  if ('permissions' in user) {
    // TypeScript knows this is an Admin
    console.log(user.permissions);
  } else {
    // TypeScript knows this is a Customer
    console.log(user.billingInfo);
  }
}
\`\`\`

The key difference in practice:
- Declaration merging combines properties (AND relationship)
- Union types represent alternatives (OR relationship)

Choose based on your modeling needs - whether the entity should have all properties combined or represent different potential shapes.`,
          timestamp: '5h ago'
        }
      ]
    },
    { 
      id: 3, 
      query: 'Optimizing PostgreSQL query performance', 
      timestamp: '1d ago',
      responseTimestamp: '1d ago',
      aiResponse: `To optimize PostgreSQL query performance, focus on these key areas:

1. **Indexing:**
   - Create appropriate indexes for frequently queried columns
   - Use EXPLAIN ANALYZE to verify index usage
   - Consider composite indexes for multi-column filters

2. **Query Structure:**
   - Avoid SELECT * and request only needed columns
   - Use LIMIT for large result sets
   - Be cautious with JOIN operations on large tables

3. **Table Design:**
   - Normalize data appropriately
   - Use proper data types (e.g., UUID vs VARCHAR)
   - Consider partitioning large tables

4. **Database Configuration:**
   - Tune work_mem for complex sorts
   - Adjust shared_buffers for caching
   - Configure maintenance settings appropriately

Example of adding an index:
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

Example of using EXPLAIN:
\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
\`\`\``,
      tags: ['SQL', 'Database'],
      sessionId: 3,
      conversation: [
        {
          id: 301,
          sender: 'user',
          content: 'Optimizing PostgreSQL query performance',
          timestamp: '1d ago'
        },
        {
          id: 302,
          sender: 'ai',
          content: `To optimize PostgreSQL query performance, focus on these key areas:

1. **Indexing:**
   - Create appropriate indexes for frequently queried columns
   - Use EXPLAIN ANALYZE to verify index usage
   - Consider composite indexes for multi-column filters

2. **Query Structure:**
   - Avoid SELECT * and request only needed columns
   - Use LIMIT for large result sets
   - Be cautious with JOIN operations on large tables

3. **Table Design:**
   - Normalize data appropriately
   - Use proper data types (e.g., UUID vs VARCHAR)
   - Consider partitioning large tables

4. **Database Configuration:**
   - Tune work_mem for complex sorts
   - Adjust shared_buffers for caching
   - Configure maintenance settings appropriately

Example of adding an index:
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

Example of using EXPLAIN:
\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
\`\`\``,
          timestamp: '1d ago'
        }
      ]
    },
    { 
      id: 4, 
      query: 'CSS Grid vs Flexbox for responsive layouts', 
      timestamp: '2d ago',
      responseTimestamp: '2d ago',
      aiResponse: `**CSS Grid vs Flexbox: When to use each**

**Flexbox:**
- One-dimensional layouts (row OR column)
- Alignment and distribution of items within a container
- When you need to allocate space proportionally
- For smaller component layouts

**CSS Grid:**
- Two-dimensional layouts (rows AND columns)
- Complex grid-based interfaces
- Precise placement of items in a layout
- Overall page layouts

**Complementary Use:**
They work well together—Grid for the overall layout, Flexbox for component alignment.

**Example Flexbox:**
\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`

**Example Grid:**
\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

Both are well-supported in modern browsers and are essential tools for responsive design.`,
      tags: ['CSS', 'Layout'],
      sessionId: 4,
      conversation: [
        {
          id: 401,
          sender: 'user',
          content: 'CSS Grid vs Flexbox for responsive layouts',
          timestamp: '2d ago'
        },
        {
          id: 402,
          sender: 'ai',
          content: `**CSS Grid vs Flexbox: When to use each**

**Flexbox:**
- One-dimensional layouts (row OR column)
- Alignment and distribution of items within a container
- When you need to allocate space proportionally
- For smaller component layouts

**CSS Grid:**
- Two-dimensional layouts (rows AND columns)
- Complex grid-based interfaces
- Precise placement of items in a layout
- Overall page layouts

**Complementary Use:**
They work well together—Grid for the overall layout, Flexbox for component alignment.

**Example Flexbox:**
\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`

**Example Grid:**
\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

Both are well-supported in modern browsers and are essential tools for responsive design.`,
          timestamp: '2d ago'
        },
        {
          id: 403,
          sender: 'user',
          content: 'Can you show an example combining both for a card layout?',
          timestamp: '2d ago'
        },
        {
          id: 404,
          sender: 'ai',
          content: `# Combining Grid and Flexbox for a Card Layout

Here's a practical example combining CSS Grid for the overall layout and Flexbox for the internal card structure:

\`\`\`html
<div class="card-grid">
  <div class="card">
    <div class="card-header">
      <img src="avatar.jpg" alt="User avatar">
      <div class="user-info">
        <h3>John Doe</h3>
        <span>Product Designer</span>
      </div>
    </div>
    <div class="card-body">
      <p>This is some content within the card that shows details about the user.</p>
    </div>
    <div class="card-footer">
      <button>View Profile</button>
      <button>Contact</button>
    </div>
  </div>
  <!-- More cards... -->
</div>
\`\`\`

\`\`\`css
/* Grid for overall layout of cards */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Card container */
.card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Card header with user info - horizontal Flexbox */
.card-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.card-header img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info h3 {
  margin: 0;
  font-size: 1.2rem;
}

.user-info span {
  color: #666;
  font-size: 0.9rem;
}

/* Card body */
.card-body {
  padding: 1rem;
  flex-grow: 1; /* Takes up available space */
}

/* Card footer with buttons - horizontal Flexbox */
.card-footer {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.card-footer button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  cursor: pointer;
}

.card-footer button:first-child {
  background: #0070f3;
  color: white;
  border-color: #0070f3;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
\`\`\`

## Benefits of this approach:

1. **Grid handles the overall layout:**
   - Automatically adjusts number of columns based on container width
   - Creates consistent spacing between cards
   - Handles alignment and responsive behavior easily

2. **Flexbox handles component layout:**
   - Card uses column direction to stack content vertically
   - Header and footer use row direction for horizontal alignment
   - Easily centers and aligns internal content

This combination provides the best of both worlds - Grid for the two-dimensional card layout, and Flexbox for the alignment of content inside each card.`,
          timestamp: '2d ago'
        }
      ]
    }
  ],
  learningProgress: [
    { id: 1, skill: 'React', progress: 85, color: '#61DAFB' },
    { id: 2, skill: 'TypeScript', progress: 72, color: '#3178C6' },
    { id: 3, skill: 'Node.js', progress: 64, color: '#339933' },
    { id: 4, skill: 'PostgreSQL', progress: 58, color: '#336791' }
  ]
};

// Mock data for saved responses in chat interface
export const mockSavedResponses = [
  {
    id: 1,
    content: `Here's how you can implement a React useEffect hook with cleanup:

\`\`\`jsx
useEffect(() => {
  // Your effect code here
  const subscription = someAPI.subscribe();

  // Return a cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [dependency1, dependency2]);
\`\`\`

The cleanup function runs before the component unmounts or before the effect runs again due to dependency changes.`,
    timestamp: '2023-05-10 14:32',
    question: 'How to implement a React useEffect hook with cleanup'
  },
  {
    id: 2,
    content: `In TypeScript, both interfaces and types can be used to define object shapes, but they have some differences:

\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
  role?: string; // Optional property
}

// Type alias
type User = {
  id: number;
  name: string;
  role?: string;
};
\`\`\`

Key differences:
- Interfaces can be extended with the extends keyword
- Types can use union and intersection operators
- Interfaces can be merged when declared multiple times
- Types can be used for primitives, unions, and tuples`,
    timestamp: '2023-05-08 09:17',
    question: 'What are the differences between TypeScript interfaces and types?'
  }
];

// Mock data for learning progress tracker
export const mockLearningData = {
  overallProgress: {
    completion: 72,
    coursesCompleted: 7,
    activeCourses: 3,
    practiceHours: 48,
    streakDays: 12
  },
  skills: [
    { 
      name: 'React', 
      progress: 85, 
      level: 'Advanced', 
      color: '#61DAFB', 
      monthlyGain: 12,
      icon: '<svg viewBox="0 0 24 24" fill="#61DAFB"><path d="M12 9.861a2.139 2.139 0 100 4.278 2.139 2.139 0 100-4.278zm-5.992 6.394l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046.317-1.023.711-2.083 1.185-3.046-.473-.963-.868-2.023-1.185-3.046zm10.675 6.484l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.475.963.87 2.023 1.186 3.046 2.674-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046-.317 1.023-.711 2.083-1.186 3.046zM5.31 8.945l-.133-.467c-.945-3.323-.3-5.92 1.592-6.653 1.892-.732 4.416.823 6.669 4.203l.235.401-.235.401a23.207 23.207 0 00-1.7 3.537l-.101.213-.213.099a23.25 23.25 0 00-3.426 2.11l-.378.335-.445-.237c-2.108-1.124-3.686-2.57-4.455-4.207l-.13-.467zm2.455-5.92c-.318 0-.601.062-.842.176-.957.37-1.35 2.127-.705 4.415.652-1.451 1.5-2.756 2.496-3.833-.357-.265-.732-.392-1.15-.392l.201-.366zm9.433 1.727c-1.892-.731-4.416.824-6.669 4.203l-.235.401.235.401a23.215 23.215 0 001.7 3.537l.101.213.213.099a23.252 23.252 0 003.426 2.11l.378.335.445-.237c2.108-1.124 3.686-2.57 4.455-4.207l.13-.467.133-.466c.944-3.323.299-5.92-1.593-6.652l-.263-.184zm.11 4.886c.318 0 .601.062.841.176.958.37 1.351 2.127.705 4.415-.651-1.451-1.499-2.756-2.496-3.833.357-.265.732-.392 1.15-.392l-.2-.366z"/></svg>'
    },
    { 
      name: 'TypeScript', 
      progress: 72, 
      level: 'Intermediate', 
      color: '#3178C6', 
      monthlyGain: 15,
      icon: '<svg viewBox="0 0 24 24" fill="#3178C6"><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>'
    },
    { 
      name: 'Node.js', 
      progress: 64, 
      level: 'Intermediate', 
      color: '#339933', 
      monthlyGain: 8,
      icon: '<svg viewBox="0 0 24 24" fill="#339933"><path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z"/></svg>'
    },
    { 
      name: 'PostgreSQL', 
      progress: 58, 
      level: 'Intermediate', 
      color: '#336791', 
      monthlyGain: 5,
      icon: '<svg viewBox="0 0 24 24" fill="#336791"><path d="M17.128 0a10.134 10.134 0 0 0-2.755.403l-.063.02A10.922 10.922 0 0 0 12.6.258C11.422.238 10.41.524 9.594 1 8.79.721 7.122.24 5.364.336 4.14.403 2.804.775 1.814 1.82.827 2.865.305 4.482.415 6.682c.03.607.203 1.597.49 2.879s.69 2.783 1.193 4.152c.503 1.37 1.054 2.6 1.915 3.436.43.419 1.022.771 1.72.742.49-.02.933-.235 1.315-.552.186.245.385.352.566.451.228.125.45.21.68.266.413.103 1.12.241 1.948.1.282-.047.579-.139.875-.27.011.33.024.653.037.98.041 1.036.067 1.993.378 2.832.05.137.187.843.727 1.466.54.624 1.598 1.013 2.803.755.85-.182 1.931-.51 2.649-1.532.71-1.01 1.03-2.459 1.093-4.809.016-.127.035-.235.055-.336l.169.015h.02c.907.041 1.891-.088 2.713-.47.728-.337 1.279-.678 1.68-1.283.1-.15.21-.331.24-.643s-.149-.8-.446-1.025c-.595-.452-.969-.28-1.37-.197a6.27 6.27 0 0 1-1.202.146c1.156-1.947 1.985-4.015 2.458-5.845.28-1.08.437-2.076.45-2.947.013-.871-.058-1.642-.58-2.309C21.36.6 19.067.024 17.293.004c-.055-.001-.11-.002-.165-.001zm-.047.64c1.678-.016 3.822.455 5.361 2.422.346.442.449 1.088.437 1.884-.013.795-.16 1.747-.429 2.79-.522 2.02-1.508 4.375-2.897 6.488a.756.756 0 0 0 .158.086c.29.12.951.223 2.27-.048.332-.07.575-.117.827.075a.52.52 0 0 1 .183.425.704.704 0 0 1-.13.336c-.255.383-.758.746-1.403 1.045-.571.266-1.39.405-2.116.413-.364.004-.7-.024-.985-.113l-.018-.007c-.11 1.06-.363 3.153-.528 4.108-.132.77-.363 1.382-.804 1.84-.44.458-1.063.734-1.901.914-1.038.223-1.795-.017-2.283-.428-.487-.41-.41-.41-.843-.09-.398-.08-.885-.103-1.434a51.426 51.426 0 0 1-.03-2.523 3.061 3.061 0 0 1-1.552.76c-.689.117-1.304.002-1.671-.09a2.276 2.276 0 0 1-.52-.201c-.17-.091-.332-.194-.44-.397a.56.56 0 0 1-.057-.381.61.61 0 0 1 .218-.331c.198-.161.46-.251.855-.333.719-.148.97-.249 1.123-.37.13-.104.277-.314.537-.622a1.16 1.16 0 0 1-.003-.041 2.96 2.96 0 0 1-1.33-.358c-.15.158-.916.968-1.85 2.092-.393.47-.827.74-1.285.759-.458.02-.872-.211-1.224-.552-.703-.683-1.264-1.858-1.753-3.186-.488-1.328-.885-2.807-1.167-4.067-.283-1.26-.45-2.276-.474-2.766-.105-2.082.382-3.485 1.217-4.37.836-.885 1.982-1.22 3.099-1.284 2.005-.115 3.909.584 4.294.734.742-.504 1.698-.818 2.892-.798a7.39 7.39 0 0 1 1.681.218l.02-.009a6.854 6.854 0 0 1 .739-.214A9.626 9.626 0 0 1 17.08.642zm.152.67h-.146a8.74 8.74 0 0 0-1.704.192c1.246.552 2.187 1.402 2.85 2.25a8.44 8.44 0 0 1 1.132 1.92c.11.264.184.487.226.66.021.087.035.16.04.236.002.038.004.077-.012.144 0 .003-.005.01-.006.013.03.876-.187 1.47-.213 2.306-.02.606.135 1.318.173 2.095.036.73-.052 1.532-.526 2.319.04.048.076.096.114.144 1.254-1.975 2.158-4.16 2.64-6.023.258-1.003.395-1.912.407-2.632.01-.72-.124-1.242-.295-1.46-1.342-1.716-3.158-2.153-4.68-2.165zm-4.79.256c-1.182.003-2.03.36-2.673.895-.663.553-1.108 1.31-1.4 2.085-.347.92-.466 1.81-.513 2.414l.013-.008c.357-.2.826-.4 1.328-.516.502-.115 1.043-.151 1.533.039s.895.637 1.042 1.315c.704 2.229-.219 4.336-.04 6.045.085.813.223 1.3.338 1.733.047.17.135.37.19.41.046.032-.44.14-.87.291-.101.037-.238.095-.412.15-.174.057-.454.054-.597.03-.143-.024-.34-.094-.336-.085l.002-.007-.006-.004s-.01-.01-.01-.01c.1-.022.202-.045.29-.122.09-.08.124-.235.163-.31.05-.1.127-.333.19-.707.064-.374.106-.889.126-1.555.02-.667.023-1.447.006-2.433a14.773 14.773 0 0 0-.118-1.93c-.064-.539-.156-1.152-.322-1.759-.166-.607-.183-1.266-.48-1.879-.05-.102-.09-.215-.15-.364-.052-.13-.053-.092-.213-.34l-.297-.453c-.025.147-.084.29-.145.438-.07.167-.151.33-.256.558-.544 1.163-1.514 2.2-2.975 2.798-.116.048-.235.09-.35.135-.188.737-.554 1.333-.237 1.553.1.07.257.016.401-.059l.053-.028c.064-.036.117-.066.196-.135.246-.218.497-.518.649-.82l.022-.045c.123-.246.225-.442.39-.633.566-.665 1.445-1.196 2.229-1.756.221-.159.423-.3.612-.43.109-.074.24-.137.335-.21L10.521 8.5c-.076-.048-.155-.124-.297-.183-.125-.053-.158-.055-.252-.109l-.005-.003a2.4 2.4 0 0 0-.56-.16 2.267 2.267 0 0 0-.646-.048c-.976.022-1.2.229-1.581.482-.204.135-.395.3-.564.436l-.022.018c-.396-.005-.793.024-1.19.084-.602.097-1.203.293-1.75.646l-.033.025c-.346.26-.65.665-.625 1.276.027.627.752 1.26 1.602 1.307.56.029 1.755-.066 2.455-.559l.005-.004c.115-.102.23-.217.345-.346.035-.04.035-.015.088-.07.034.045.034-.01.114.007.29.061.417.149.412.255-.007.12-.122.254-.295.362a3.17 3.17 0 0 1-.599.326c-.505.204-1.157.287-1.654.064-.734-.326-1.06-1.029-1.022-1.4.021-.206.105-.365.19-.51.056-.095.057-.055.18-.211.057-.073.04-.095.052-.16.014-.075.074-.147.142-.23a.738.738 0 0 1 .285-.24 3.377 3.377 0 0 1 .868-.254c.252-.043.502-.06.752-.064l.004-.002c-.473-.352-1.158-.685-1.809-.905a5.311 5.311 0 0 0-1.893-.206c-.896.055-1.811.337-2.395.917-.585.58-.741 1.415-.741 2.082 0 .343.054.689.142 1.014.345 1.268 1.203 3.393 2.267 5.182l.019.031c.464.782.96 1.288 1.399 1.595.455.317.81.395 1.102.381.334-.019.644-.242.918-.621l-.087.063c.884-1.058 1.544-1.765 1.709-1.953l.019-.022c-.345-.361-.584-.843-.584-1.378 0-.537.245-1.025.595-1.385l.008-.008c.364-.373.881-.607 1.456-.607a2.061 2.061 0 0 1 1.468.606l.006.008c.347.36.59.85.585 1.387 0 .241-.065.474-.153.687-.05.124-.661 1.53-.703 1.607.321.22.553.542.687.956.63 1.935-1.355 6.694-2.404 9.81l-.034.1a21.677 21.677 0 0 0-.278.874l-.095.334c.067-.026.444-.245.723-.404.616-.352 1.183-.703 1.731-1.112.357-.266.681-.553 1-.854.18-.171.332-.351.501-.547l.024-.03c.151-.193.28-.396.426-.617.102-.155.254-.399.362-.598l.017-.03a3.11 3.11 0 0 0 .365-1.028c.075-.377.097-.758.097-1.109-.001-.687-.087-1.339-.18-1.941-.129-.817-.287-1.571-.465-2.264l-.01-.044a15.193 15.193 0 0 1-.221-.994 8.056 8.056 0 0 1-.099-.531c-.02-.127-.042-.26-.062-.398-.016-.112-.018-.258-.004-.397l.003-.029c.033-.303.181-.605.39-.844.214-.245.496-.425.829-.418.192.004.412.063.635.289.226.22.353.504.439.753l.017.05c.127.462.11.997.067 1.458-.042.467-.121.975-.244 1.393a5.494 5.494 0 0 1-.569 1.324l-.007.011c.77.474 1.784.881 2.853.956.57.04 1.16-.02 1.683-.263.477-.219.87-.587 1.008-1.165.105-.445.105-.913.089-1.44-.016-.526-.06-1.13-.163-1.773-.12-.748-.294-1.57-.507-2.44a18.003 18.003 0 0 0-.71-2.254c-.23-.578-.483-1.13-.763-1.634a13.021 13.021 0 0 0-1.866-2.688c-.337-.373-.677-.703-1.019-.975-.87-.702-1.845-1.14-2.763-1.455a9.983 9.983 0 0 0-1.224-.34l-.063-.01a7.317 7.317 0 0 0-.644-.088c-.148-.014-.296-.023-.447-.027z"/></svg>'
    }
  ],
  courses: [
    {
      id: 1,
      title: "React Advanced Patterns",
      description: "Learn advanced React patterns including hooks, context, and performance optimization",
      progress: 65,
      totalLessons: 12,
      completedLessons: 8
    },
    {
      id: 2,
      title: "TypeScript Deep Dive",
      description: "Master TypeScript's type system, generics, and advanced features",
      progress: 42,
      totalLessons: 15,
      completedLessons: 6
    },
    {
      id: 3,
      title: "PostgreSQL for Developers",
      description: "Learn database design, optimization, and advanced queries",
      progress: 28,
      totalLessons: 10,
      completedLessons: 3
    }
  ],
  recommendedCourses: [
    {
      title: "Node.js Microservices",
      description: "Build scalable microservices with Node.js and Docker",
      badge: "NEW",
      badgeColorClass: "green-400",
      badgeTextClass: "green-900",
      thumbnailUrl: "https://images.unsplash.com/photo-1551135049-8a33b5883817?q=80&w=1770&auto=format&fit=crop",
      rating: 4.9,
      reviewCount: "1.2k"
    },
    {
      title: "GraphQL API Development",
      description: "Build, test, and deploy GraphQL APIs with Apollo Server",
      badge: "TRENDING",
      badgeColorClass: "blue-400",
      badgeTextClass: "blue-900",
      thumbnailUrl: "https://images.unsplash.com/photo-1550645612-83f5d594b671?q=80&w=1770&auto=format&fit=crop",
      rating: 4.7,
      reviewCount: "956"
    },
    {
      title: "Test-Driven Development",
      description: "Learn to write tests before code for better quality",
      badge: "POPULAR",
      badgeColorClass: "yellow-400",
      badgeTextClass: "yellow-900",
      thumbnailUrl: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=1964&auto=format&fit=crop",
      rating: 4.5,
      reviewCount: "2.3k"
    }
  ]
};
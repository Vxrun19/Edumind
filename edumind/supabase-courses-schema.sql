-- ─── Courses Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  emoji TEXT NOT NULL DEFAULT '',
  is_free BOOLEAN NOT NULL DEFAULT true,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to courses" ON courses FOR ALL USING (true);

-- ─── Lessons Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lessons" ON lessons FOR ALL USING (true);

-- ─── Course Progress Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_accessed TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  percentage INTEGER DEFAULT 0,
  certificate_name TEXT,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);

ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to course_progress" ON course_progress FOR ALL USING (true);


-- ═══════════════════════════════════════════════════════════
--  SEED DATA: Courses
-- ═══════════════════════════════════════════════════════════

-- FREE COURSES
INSERT INTO courses (id, title, description, subject, difficulty, emoji, is_free, total_lessons, estimated_hours) VALUES
('python-beginners', 'Python for Complete Beginners', 'Start your coding journey with Python — the world''s most beginner-friendly programming language. Learn variables, loops, functions, and build your first programs.', 'Coding', 'Beginner', '🐍', true, 10, 3),
('math-foundations', 'Math Foundations', 'Build a rock-solid foundation in mathematics. Cover arithmetic, fractions, decimals, basic algebra, and problem-solving strategies.', 'Math', 'Beginner', '🔢', true, 8, 2),
('english-writing-basics', 'English Writing Basics', 'Master the fundamentals of English writing — grammar, sentence structure, paragraphs, and clear communication.', 'English', 'Beginner', '✍️', true, 6, 1.5),
('how-internet-works', 'How the Internet Works', 'Understand the technology behind the internet — from browsers and servers to DNS, HTTP, and how data travels the world.', 'Tech', 'Beginner', '🌐', true, 5, 1),
('personal-finance-101', 'Personal Finance 101', 'Learn essential money skills — budgeting, saving, investing basics, and how to make smart financial decisions.', 'Finance', 'Beginner', '💰', true, 7, 2),
('study-skills', 'Study Skills & Learning How to Learn', 'Discover proven techniques for effective studying — active recall, spaced repetition, note-taking methods, and time management.', 'Life Skills', 'Beginner', '🧠', true, 6, 1.5);

-- PRO COURSES
INSERT INTO courses (id, title, description, subject, difficulty, emoji, is_free, total_lessons, estimated_hours) VALUES
('fullstack-web-dev', 'Full Stack Web Development Roadmap', 'A complete roadmap from HTML/CSS to React, Node.js, databases, and deployment. Build real projects along the way.', 'Coding', 'Intermediate', '🚀', false, 20, 10),
('advanced-mathematics', 'Advanced Mathematics', 'Dive deep into calculus, linear algebra, statistics, and mathematical reasoning for advanced students and exam prep.', 'Math', 'Advanced', '📐', false, 15, 6),
('data-science-ai', 'Data Science & AI Fundamentals', 'Learn data analysis, machine learning concepts, Python for data science, and understand how AI systems work.', 'Coding/AI', 'Intermediate', '🤖', false, 18, 8),
('public-speaking', 'Public Speaking & Communication', 'Build confidence in public speaking — structure speeches, manage anxiety, use body language, and communicate persuasively.', 'Life Skills', 'Intermediate', '🎤', false, 10, 3),
('business-entrepreneurship', 'Business & Entrepreneurship', 'Learn business fundamentals — idea validation, marketing, finance, leadership, and how to launch your own venture.', 'Business', 'Intermediate', '💼', false, 12, 4),
('exam-preparation', 'IELTS/SAT Exam Preparation', 'Comprehensive exam prep covering reading, writing, math, and test-taking strategies for IELTS and SAT exams.', 'English', 'Advanced', '📝', false, 15, 6);


-- ═══════════════════════════════════════════════════════════
--  SEED DATA: Lessons
-- ═══════════════════════════════════════════════════════════

-- Python for Complete Beginners (10 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('python-beginners-1', 'python-beginners', 1, 'What is Programming?', 'Understanding what programming is and why Python is a great first language', 15),
('python-beginners-2', 'python-beginners', 2, 'Setting Up Python', 'Installing Python and writing your first "Hello World" program', 15),
('python-beginners-3', 'python-beginners', 3, 'Variables and Data Types', 'Storing data in variables — strings, numbers, and booleans', 20),
('python-beginners-4', 'python-beginners', 4, 'Input and Output', 'Getting user input and displaying output with print()', 15),
('python-beginners-5', 'python-beginners', 5, 'Conditionals: If/Else', 'Making decisions in your code with if, elif, and else', 20),
('python-beginners-6', 'python-beginners', 6, 'Loops: For and While', 'Repeating actions with for loops and while loops', 20),
('python-beginners-7', 'python-beginners', 7, 'Lists and Dictionaries', 'Storing collections of data with lists and dictionaries', 20),
('python-beginners-8', 'python-beginners', 8, 'Functions', 'Creating reusable blocks of code with functions', 20),
('python-beginners-9', 'python-beginners', 9, 'Error Handling', 'Understanding and handling errors gracefully with try/except', 15),
('python-beginners-10', 'python-beginners', 10, 'Your First Project: Number Guessing Game', 'Putting it all together to build a fun number guessing game', 20);

-- Math Foundations (8 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('math-foundations-1', 'math-foundations', 1, 'Number Sense and Place Value', 'Understanding how numbers work and their place values', 15),
('math-foundations-2', 'math-foundations', 2, 'Addition and Subtraction Mastery', 'Strategies for fast and accurate addition and subtraction', 15),
('math-foundations-3', 'math-foundations', 3, 'Multiplication and Division', 'Building fluency with multiplication tables and division', 15),
('math-foundations-4', 'math-foundations', 4, 'Fractions Made Easy', 'Understanding, comparing, and operating with fractions', 15),
('math-foundations-5', 'math-foundations', 5, 'Decimals and Percentages', 'Working with decimals and understanding percentages', 15),
('math-foundations-6', 'math-foundations', 6, 'Introduction to Algebra', 'Using letters for unknowns and solving simple equations', 15),
('math-foundations-7', 'math-foundations', 7, 'Geometry Basics', 'Shapes, angles, area, and perimeter fundamentals', 15),
('math-foundations-8', 'math-foundations', 8, 'Problem Solving Strategies', 'Applying math to real-world word problems', 15);

-- English Writing Basics (6 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('english-writing-1', 'english-writing-basics', 1, 'Parts of Speech', 'Nouns, verbs, adjectives, adverbs — the building blocks of English', 15),
('english-writing-2', 'english-writing-basics', 2, 'Sentence Structure', 'Building clear, correct sentences with subjects, verbs, and objects', 15),
('english-writing-3', 'english-writing-basics', 3, 'Punctuation and Grammar', 'Commas, periods, apostrophes, and common grammar rules', 15),
('english-writing-4', 'english-writing-basics', 4, 'Writing Paragraphs', 'Topic sentences, supporting details, and paragraph structure', 15),
('english-writing-5', 'english-writing-basics', 5, 'Common Mistakes to Avoid', 'Their/there/they''re, your/you''re, and other frequent errors', 15),
('english-writing-6', 'english-writing-basics', 6, 'Writing a Short Essay', 'Putting it all together — introduction, body, and conclusion', 15);

-- How the Internet Works (5 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('internet-works-1', 'how-internet-works', 1, 'What is the Internet?', 'A simple explanation of what the internet actually is', 12),
('internet-works-2', 'how-internet-works', 2, 'Browsers and Servers', 'How your browser talks to servers to load web pages', 12),
('internet-works-3', 'how-internet-works', 3, 'DNS: The Internet Phone Book', 'How domain names get translated to IP addresses', 12),
('internet-works-4', 'how-internet-works', 4, 'HTTP and HTTPS', 'How data is sent and received securely on the web', 12),
('internet-works-5', 'how-internet-works', 5, 'How Data Travels the World', 'Packets, routers, and the physical infrastructure of the internet', 12);

-- Personal Finance 101 (7 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('finance-101-1', 'personal-finance-101', 1, 'Money Mindset', 'Understanding your relationship with money and financial goals', 15),
('finance-101-2', 'personal-finance-101', 2, 'Budgeting Basics', 'Creating a simple budget that actually works', 20),
('finance-101-3', 'personal-finance-101', 3, 'Saving Strategies', 'Emergency funds, saving goals, and the pay-yourself-first rule', 15),
('finance-101-4', 'personal-finance-101', 4, 'Understanding Debt', 'Good debt vs bad debt, interest rates, and paying off debt', 15),
('finance-101-5', 'personal-finance-101', 5, 'Investing for Beginners', 'Stocks, bonds, index funds — the basics of growing your money', 20),
('finance-101-6', 'personal-finance-101', 6, 'Banking and Credit Scores', 'How banks work, credit scores, and why they matter', 15),
('finance-101-7', 'personal-finance-101', 7, 'Smart Financial Decisions', 'Avoiding scams, impulse buying, and making money work for you', 15);

-- Study Skills & Learning How to Learn (6 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('study-skills-1', 'study-skills', 1, 'How Your Brain Learns', 'Understanding memory, focus, and how learning actually works', 15),
('study-skills-2', 'study-skills', 2, 'Active Recall', 'The most powerful study technique — test yourself to remember better', 15),
('study-skills-3', 'study-skills', 3, 'Spaced Repetition', 'Why timing matters and how to space out your studying', 15),
('study-skills-4', 'study-skills', 4, 'Note-Taking Methods', 'Cornell method, mind maps, and effective note-taking strategies', 15),
('study-skills-5', 'study-skills', 5, 'Time Management for Students', 'Pomodoro technique, scheduling, and beating procrastination', 15),
('study-skills-6', 'study-skills', 6, 'Exam Preparation Strategies', 'How to prepare for exams effectively without cramming', 15);

-- Full Stack Web Development Roadmap (20 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('fullstack-1', 'fullstack-web-dev', 1, 'Web Development Overview', 'Understanding frontend, backend, and how they work together', 25),
('fullstack-2', 'fullstack-web-dev', 2, 'HTML Fundamentals', 'Building the structure of web pages with HTML', 30),
('fullstack-3', 'fullstack-web-dev', 3, 'CSS Styling', 'Making web pages beautiful with CSS', 30),
('fullstack-4', 'fullstack-web-dev', 4, 'Responsive Design', 'Making websites work on all screen sizes', 30),
('fullstack-5', 'fullstack-web-dev', 5, 'JavaScript Basics', 'Adding interactivity with JavaScript fundamentals', 30),
('fullstack-6', 'fullstack-web-dev', 6, 'JavaScript DOM Manipulation', 'Dynamically changing web pages with JavaScript', 30),
('fullstack-7', 'fullstack-web-dev', 7, 'Modern JavaScript (ES6+)', 'Arrow functions, destructuring, modules, and more', 30),
('fullstack-8', 'fullstack-web-dev', 8, 'React Fundamentals', 'Building UIs with React components and JSX', 30),
('fullstack-9', 'fullstack-web-dev', 9, 'React State and Props', 'Managing data flow in React applications', 30),
('fullstack-10', 'fullstack-web-dev', 10, 'React Hooks and Effects', 'useState, useEffect, and custom hooks', 30),
('fullstack-11', 'fullstack-web-dev', 11, 'Routing and Navigation', 'Single page applications with React Router', 30),
('fullstack-12', 'fullstack-web-dev', 12, 'Node.js Introduction', 'Server-side JavaScript with Node.js', 30),
('fullstack-13', 'fullstack-web-dev', 13, 'Express.js and REST APIs', 'Building APIs with Express.js', 30),
('fullstack-14', 'fullstack-web-dev', 14, 'Databases: SQL Basics', 'Storing data with PostgreSQL and SQL queries', 30),
('fullstack-15', 'fullstack-web-dev', 15, 'Database Integration', 'Connecting your API to a database', 30),
('fullstack-16', 'fullstack-web-dev', 16, 'Authentication and Security', 'User login, JWT tokens, and security best practices', 30),
('fullstack-17', 'fullstack-web-dev', 17, 'File Uploads and Storage', 'Handling file uploads and cloud storage', 30),
('fullstack-18', 'fullstack-web-dev', 18, 'Testing Your Application', 'Unit tests, integration tests, and test-driven development', 30),
('fullstack-19', 'fullstack-web-dev', 19, 'Deployment', 'Deploying your full stack application to the cloud', 30),
('fullstack-20', 'fullstack-web-dev', 20, 'Final Project: Build a Full Stack App', 'Putting it all together in a capstone project', 45);

-- Advanced Mathematics (15 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('adv-math-1', 'advanced-mathematics', 1, 'Functions and Graphs', 'Understanding functions, domains, ranges, and graphing', 25),
('adv-math-2', 'advanced-mathematics', 2, 'Limits and Continuity', 'The foundation of calculus — understanding limits', 25),
('adv-math-3', 'advanced-mathematics', 3, 'Introduction to Derivatives', 'Rates of change and the concept of differentiation', 25),
('adv-math-4', 'advanced-mathematics', 4, 'Derivative Rules and Applications', 'Power rule, chain rule, and practical applications', 25),
('adv-math-5', 'advanced-mathematics', 5, 'Introduction to Integrals', 'Area under curves and the concept of integration', 25),
('adv-math-6', 'advanced-mathematics', 6, 'Integration Techniques', 'Substitution, parts, and other integration methods', 25),
('adv-math-7', 'advanced-mathematics', 7, 'Sequences and Series', 'Arithmetic, geometric sequences, and convergence', 25),
('adv-math-8', 'advanced-mathematics', 8, 'Vectors and Matrices', 'Introduction to linear algebra concepts', 25),
('adv-math-9', 'advanced-mathematics', 9, 'Matrix Operations', 'Multiplication, inverses, and determinants', 25),
('adv-math-10', 'advanced-mathematics', 10, 'Systems of Equations', 'Solving systems using matrices and elimination', 25),
('adv-math-11', 'advanced-mathematics', 11, 'Probability Fundamentals', 'Events, sample spaces, and probability rules', 25),
('adv-math-12', 'advanced-mathematics', 12, 'Statistics and Distributions', 'Mean, median, standard deviation, and normal distribution', 25),
('adv-math-13', 'advanced-mathematics', 13, 'Hypothesis Testing', 'Statistical tests and drawing conclusions from data', 25),
('adv-math-14', 'advanced-mathematics', 14, 'Trigonometry Deep Dive', 'Trig functions, identities, and applications', 25),
('adv-math-15', 'advanced-mathematics', 15, 'Mathematical Proofs and Reasoning', 'Logic, proof techniques, and mathematical thinking', 25);

-- Data Science & AI Fundamentals (18 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('ds-ai-1', 'data-science-ai', 1, 'What is Data Science?', 'Overview of the data science field and its applications', 25),
('ds-ai-2', 'data-science-ai', 2, 'Python for Data Science', 'Setting up your data science toolkit with Python', 25),
('ds-ai-3', 'data-science-ai', 3, 'Working with NumPy', 'Numerical computing with NumPy arrays', 25),
('ds-ai-4', 'data-science-ai', 4, 'Data Analysis with Pandas', 'Loading, cleaning, and analyzing data with Pandas', 30),
('ds-ai-5', 'data-science-ai', 5, 'Data Visualization', 'Creating charts and graphs with Matplotlib and Seaborn', 25),
('ds-ai-6', 'data-science-ai', 6, 'Exploratory Data Analysis', 'Techniques for understanding and exploring datasets', 25),
('ds-ai-7', 'data-science-ai', 7, 'Statistics for Data Science', 'Essential statistical concepts for data analysis', 25),
('ds-ai-8', 'data-science-ai', 8, 'Introduction to Machine Learning', 'What is ML and how machines learn from data', 25),
('ds-ai-9', 'data-science-ai', 9, 'Supervised Learning: Regression', 'Predicting numerical values with regression models', 30),
('ds-ai-10', 'data-science-ai', 10, 'Supervised Learning: Classification', 'Categorizing data with classification algorithms', 30),
('ds-ai-11', 'data-science-ai', 11, 'Unsupervised Learning', 'Clustering, dimensionality reduction, and pattern discovery', 25),
('ds-ai-12', 'data-science-ai', 12, 'Model Evaluation', 'Accuracy, precision, recall, and choosing the right metrics', 25),
('ds-ai-13', 'data-science-ai', 13, 'Feature Engineering', 'Creating and selecting the right features for models', 25),
('ds-ai-14', 'data-science-ai', 14, 'Neural Networks Basics', 'Understanding how neural networks work', 30),
('ds-ai-15', 'data-science-ai', 15, 'Deep Learning Overview', 'CNNs, RNNs, and modern deep learning architectures', 25),
('ds-ai-16', 'data-science-ai', 16, 'Natural Language Processing', 'Teaching machines to understand human language', 25),
('ds-ai-17', 'data-science-ai', 17, 'AI Ethics and Bias', 'Responsible AI — fairness, bias, and ethical considerations', 25),
('ds-ai-18', 'data-science-ai', 18, 'Building an End-to-End ML Project', 'From data collection to deployment — a complete project', 35);

-- Public Speaking & Communication (10 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('speaking-1', 'public-speaking', 1, 'Overcoming the Fear of Speaking', 'Understanding stage fright and techniques to manage anxiety', 15),
('speaking-2', 'public-speaking', 2, 'Structuring Your Message', 'How to organize a talk with a clear beginning, middle, and end', 20),
('speaking-3', 'public-speaking', 3, 'The Power of Storytelling', 'Using stories to engage and persuade your audience', 15),
('speaking-4', 'public-speaking', 4, 'Body Language and Presence', 'How your posture, gestures, and eye contact affect your message', 20),
('speaking-5', 'public-speaking', 5, 'Voice and Delivery', 'Pace, tone, volume, and pauses — mastering vocal delivery', 15),
('speaking-6', 'public-speaking', 6, 'Visual Aids and Slides', 'Creating effective presentations that support your message', 20),
('speaking-7', 'public-speaking', 7, 'Handling Q&A Sessions', 'Answering questions confidently and thinking on your feet', 15),
('speaking-8', 'public-speaking', 8, 'Persuasive Communication', 'Techniques for influencing and persuading your audience', 20),
('speaking-9', 'public-speaking', 9, 'Virtual Presentations', 'Speaking effectively in online meetings and webinars', 15),
('speaking-10', 'public-speaking', 10, 'Your Signature Talk', 'Creating and delivering your own signature presentation', 25);

-- Business & Entrepreneurship (12 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('business-1', 'business-entrepreneurship', 1, 'The Entrepreneurial Mindset', 'What makes entrepreneurs different and how to think like one', 20),
('business-2', 'business-entrepreneurship', 2, 'Finding a Business Idea', 'Identifying problems worth solving and validating ideas', 20),
('business-3', 'business-entrepreneurship', 3, 'Market Research', 'Understanding your target market and competition', 20),
('business-4', 'business-entrepreneurship', 4, 'Business Models', 'How businesses make money — different business model types', 20),
('business-5', 'business-entrepreneurship', 5, 'Building a Brand', 'Creating a brand identity that resonates with customers', 20),
('business-6', 'business-entrepreneurship', 6, 'Marketing Fundamentals', 'Digital marketing, social media, and getting your first customers', 20),
('business-7', 'business-entrepreneurship', 7, 'Sales and Customer Relations', 'Selling your product and building lasting customer relationships', 20),
('business-8', 'business-entrepreneurship', 8, 'Financial Management', 'Revenue, expenses, profit margins, and financial planning', 20),
('business-9', 'business-entrepreneurship', 9, 'Building a Team', 'Hiring, leadership, and creating a great company culture', 20),
('business-10', 'business-entrepreneurship', 10, 'Pitching Your Idea', 'Creating a compelling pitch deck and presenting to investors', 20),
('business-11', 'business-entrepreneurship', 11, 'Legal Basics', 'Business structures, contracts, and protecting your business', 20),
('business-12', 'business-entrepreneurship', 12, 'Scaling Your Business', 'Growth strategies, systems, and taking your business to the next level', 20);

-- IELTS/SAT Exam Preparation (15 lessons)
INSERT INTO lessons (id, course_id, lesson_number, title, description, estimated_minutes) VALUES
('exam-prep-1', 'exam-preparation', 1, 'Understanding the Exam Format', 'Overview of IELTS and SAT structure, scoring, and what to expect', 20),
('exam-prep-2', 'exam-preparation', 2, 'Reading Comprehension Strategies', 'Speed reading, skimming, scanning, and answering techniques', 25),
('exam-prep-3', 'exam-preparation', 3, 'Advanced Reading Practice', 'Tackling complex passages and inference questions', 25),
('exam-prep-4', 'exam-preparation', 4, 'Writing: Essay Structure', 'Planning and structuring high-scoring essays', 25),
('exam-prep-5', 'exam-preparation', 5, 'Writing: Argument and Analysis', 'Building persuasive arguments and analyzing evidence', 25),
('exam-prep-6', 'exam-preparation', 6, 'Writing: Grammar and Style', 'Advanced grammar, vocabulary, and writing style for exams', 25),
('exam-prep-7', 'exam-preparation', 7, 'SAT Math: Algebra and Functions', 'Core algebra concepts tested on the SAT', 25),
('exam-prep-8', 'exam-preparation', 8, 'SAT Math: Advanced Topics', 'Geometry, trigonometry, and complex problem-solving', 25),
('exam-prep-9', 'exam-preparation', 9, 'SAT Math: Data Analysis', 'Statistics, probability, and data interpretation', 25),
('exam-prep-10', 'exam-preparation', 10, 'IELTS Listening Skills', 'Strategies for the IELTS listening section', 25),
('exam-prep-11', 'exam-preparation', 11, 'IELTS Speaking Practice', 'Fluency, coherence, and speaking test techniques', 25),
('exam-prep-12', 'exam-preparation', 12, 'Vocabulary Building', 'Essential vocabulary for high exam scores', 25),
('exam-prep-13', 'exam-preparation', 13, 'Time Management in Exams', 'Pacing yourself and managing time during the test', 25),
('exam-prep-14', 'exam-preparation', 14, 'Practice Test Strategies', 'How to use practice tests effectively for maximum improvement', 25),
('exam-prep-15', 'exam-preparation', 15, 'Final Review and Exam Day Tips', 'Last-minute review strategies and what to do on exam day', 25);

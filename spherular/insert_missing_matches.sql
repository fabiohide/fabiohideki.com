-- SQL Script to insert missing playoff and Selado Cego matches into the Supabase database.
-- Run this in your Supabase SQL Editor (New Query) to enable score reporting for these matches.

-- Insert missing playoff matches
INSERT INTO matches (id, "group", player1, player2, player1_score, player2_score, completed) 
VALUES 
('t8-q1', 3, '', '', NULL, NULL, false),
('t8-q2', 3, '', '', NULL, NULL, false),
('t8-q3', 3, '', '', NULL, NULL, false),
('t8-q4', 3, '', '', NULL, NULL, false),
('t8-s1', 3, '', '', NULL, NULL, false),
('t8-s2', 3, '', '', NULL, NULL, false),
('t8-f1', 3, '', '', NULL, NULL, false),
('t8-f2', 3, '', '', NULL, NULL, false),
('t8-f3', 3, '', '', NULL, NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Insert missing Selado Cego matches
INSERT INTO matches (id, "group", player1, player2, player1_score, player2_score, completed) 
VALUES 
('sc-0', 4, '', '', NULL, NULL, false),
('sc-1', 4, '', '', NULL, NULL, false),
('sc-2', 4, '', '', NULL, NULL, false),
('sc-3', 4, '', '', NULL, NULL, false),
('sc-4', 4, '', '', NULL, NULL, false),
('sc-5', 4, '', '', NULL, NULL, false),
('sc-6', 4, '', '', NULL, NULL, false),
('sc-7', 4, '', '', NULL, NULL, false),
('sc-8', 4, '', '', NULL, NULL, false),
('sc-9', 4, '', '', NULL, NULL, false),
('sc-10', 4, '', '', NULL, NULL, false),
('sc-11', 4, '', '', NULL, NULL, false),
('sc-12', 4, '', '', NULL, NULL, false),
('sc-13', 4, '', '', NULL, NULL, false),
('sc-14', 4, '', '', NULL, NULL, false),
('sc-15', 4, '', '', NULL, NULL, false)
ON CONFLICT (id) DO NOTHING;

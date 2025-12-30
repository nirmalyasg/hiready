-- Seed data for avatars table
-- Run: psql $DATABASE_URL -f database/seeds/avatars.sql

INSERT INTO avatars (id, name, ethnicity, gender, role, look, image_url) VALUES
('Alessandra_Black_Suit_public', 'Aisha', 'Indian', 'female', NULL, 'in Black Suit', 'https://files2.heygen.ai/avatar/v3/ef3893cf0bf84411851d1f360a36462e_55310/preview_target.webp'),
('Alessandra_Chair_Sitting_public', 'Sanya', 'African-American', 'female', NULL, 'Chair Sitting', 'https://files2.heygen.ai/avatar/v3/89e07b826f1c4cb1a5549201cdd8f4d6_55300/preview_target.webp'),
('Alessandra_Grey_Sweater_public', 'Rhea', 'East Asian', 'female', NULL, 'in Grey Sweater', 'https://files2.heygen.ai/avatar/v3/dce2de72df964375a25af29e461fb734_55310/preview_talk_1.webp'),
('Alessandra_ProfessionalLook2_public', 'Anika', 'Middle Eastern', 'female', NULL, 'Professional Look 2', 'https://files2.heygen.ai/avatar/v3/92f863c1db2d48cbb34e803866881192_55810/preview_talk_1.webp'),
('Alessandra_ProfessionalLook_public', 'Tara', 'Latinx', 'female', NULL, 'Professional Look', 'https://files2.heygen.ai/avatar/v3/0d03b7be19ad472fac4144cd0d2e808d_55810/preview_target.webp'),
('Amina_Black_Suit_public', 'Nadia', 'Southeast Asian', 'female', NULL, 'in Black Suit', 'https://files2.heygen.ai/avatar/v3/d457fb0050a046a683058666fa3b2252_55270/preview_talk_1.webp'),
('Amina_Blue_Suit_public', 'Lina', 'Mediterranean', 'female', NULL, 'in Blue Suit', 'https://files2.heygen.ai/avatar/v3/04fe00b09f6248b9808812a2d1cba23a_55270/preview_target.webp'),
('Amina_CasualLook_public', 'Kiara', 'Indian', 'female', NULL, 'Casual Look', 'https://files2.heygen.ai/avatar/v3/93fad1758b264feb94ed8133344846de_55760/preview_target.webp'),
('Amina_Chair_Sitting_public', 'Mila', 'Caucasian', 'female', NULL, 'Chair Sitting', 'https://files2.heygen.ai/avatar/v3/59cde571f56d4952bac9564da7d3ccc3_55260/preview_target.webp'),
('Amina_ProfessionalLook2_public', 'Sofia', 'African-American', 'female', NULL, 'Professional Look 2', 'https://files2.heygen.ai/avatar/v3/6705b79f647a4699b91f722b26424fc9_55770/preview_talk_1.webp'),
('Amina_ProfessionalLook_public', 'Elena', 'East Asian', 'female', NULL, 'Professional Look', 'https://files2.heygen.ai/avatar/v3/1befda9feaba4d4ca22dc6cfda0e65c2_55770/preview_target.webp'),
('Anastasia_Black_Suit_public', 'Maya', 'Middle Eastern', 'female', NULL, 'in Black Suit', 'https://files2.heygen.ai/avatar/v3/c0fb0437a2b64fc991e68923af50e172_55290/preview_talk_1.webp'),
('Anastasia_CasualLook_public', 'Aria', 'Latinx', 'female', NULL, 'Casual Look', 'https://files2.heygen.ai/avatar/v3/590135b2e0154e4aa8f4f9aafcc83165_55780/preview_target.webp'),
('Anastasia_Chair_Sitting_public', 'Leona', 'Southeast Asian', 'female', NULL, 'Chair Sitting', 'https://files2.heygen.ai/avatar/v3/d3370d0f86784bde8e2144d16d573dcc_55280/preview_target.webp'),
('Anastasia_Grey_Shirt_public', 'Zara', 'Mediterranean', 'female', NULL, 'in Grey Shirt', 'https://files2.heygen.ai/avatar/v3/9849a1cbe96f46b0a3bb5be895237124_55290/preview_target.webp'),
('Anastasia_ProfessionalLook2_public', 'Nora', 'Indian', 'female', NULL, 'Professional Look 2', 'https://files2.heygen.ai/avatar/v3/fe78bf59639d4eb2ade0cde74cee984b_55790/preview_talk_1.webp'),
('Anastasia_ProfessionalLook_public', 'Ella', 'Caucasian', 'female', NULL, 'Professional Look', 'https://files2.heygen.ai/avatar/v3/6428cf3872094995af8f40696ddd6ef3_55790/preview_target.webp'),
('Ann_Doctor_Sitting_public', 'Isha', 'African-American', 'female', NULL, 'Doctor Sitting', 'https://files2.heygen.ai/avatar/v3/26de369b2d4443e586dedf27af1e0c1d_45570/preview_talk_1.webp'),
('Ann_Doctor_Standing2_public', 'Priya', 'East Asian', 'female', NULL, 'Doctor Standing', 'https://files2.heygen.ai/avatar/v3/699a4c2995914d39b2cb311a930d7720_45570/preview_talk_3.webp'),
('Graham_Black_Suit_public', 'Ethan', 'Middle Eastern', 'male', NULL, 'in Black Suit', 'https://files2.heygen.ai/avatar/v3/e04ebabcc6784cb6959a866605474650_55350/preview_talk_1.webp')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, ethnicity = EXCLUDED.ethnicity, gender = EXCLUDED.gender, image_url = EXCLUDED.image_url;

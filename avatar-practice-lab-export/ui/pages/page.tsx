
import React, { useState, useEffect } from 'react';
// import { Search } from 'lucide-react';
//  import InteractiveAvatar from "@/components/InteractiveAvatar";
// import type { Skill, Scenario } from '@/app/lib/types';
// import SessionCleanup from "@/components/avatar-simulator/SessionCleanup";
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const avatarData = [
  {
    id: 'Dexter_Lawyer_Sitting_public',
    name: 'Dexter',
    ethnicity: 'American',
    gender: 'Male',
    role: 'Manager',
    image: 'https://files2.heygen.ai/avatar/v3/e20ac0c902184ff793e75ae4e139b7dc_45600/preview_target.webp'
  },
  {
    id: 'Elenora_IT_Sitting_public',
    name: 'Elenora',
    ethnicity: 'German',
    gender: 'Female',
    role: 'Manager',
    image: 'https://files2.heygen.ai/avatar/v3/cbd4a69890a040e6a0d54088e606a559_45610/preview_talk_3.webp'
  },
  {
    id: 'June_HR_public',
    name: 'June',
    ethnicity: 'Asian',
    gender: 'Female',
    role: 'Manager',
    image: 'https://files2.heygen.ai/avatar/v3/74447a27859a456c955e01f21ef18216_45620/preview_talk_1.webp'
  },
  {
    id: 'Silas_CustomerSupport_public',
    name: 'Silas',
    ethnicity: 'British',
    gender: 'Male',
    role: 'Customer',
    image: 'https://files2.heygen.ai/avatar/v3/a1ed8c71e4bf4e6cb9071d2b7cd71e4e_45660/preview_talk_1.webp'
  },
  {
    id: 'Wayne_20240711',
    name: 'Wayne',
    ethnicity: 'Asian',
    gender: 'Male',
    role: 'Customer',
    image: 'https://files2.heygen.ai/avatar/v3/a3fdb0c652024f79984aaec11ebf2694_34350/preview_target.webp'
  },
  {
    id: '37f4d912aa564663a1cf8d63acd0e1ab',
    name: 'Katrina',
    ethnicity: 'French',
    gender: 'Female',
    role: 'Manager',
    image: 'https://files2.heygen.ai/avatar/v3/37f4d912aa564663a1cf8d63acd0e1ab/full/2.2/preview_target.webp'
  }
];

// const CreateScenario = ({ skillId, onScenarioCreated }) => {
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [generating, setGenerating] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setGenerating(true);
//     try {
//       const response = await fetch('/api/generate-scenario', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ skillId, title, description }),
//       });
//       const data = await response.json();
//       if (data.success) {
//         onScenarioCreated();
//         alert('Scenario generated successfully!');
//       } else {
//         alert('Failed to generate scenario.');
//       }
//     } catch (error) {
//       console.error('Error generating scenario:', error);
//       alert('An error occurred.');
//     } finally {
//       setGenerating(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
//       <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
//       <Button type="submit" color="primary" disabled={generating}>
//         {generating ? 'Generating...' : 'Generate Scenario'}
//       </Button>
//     </form>
//   );
// };


export default function AvatarHomePage() {
  const navigate = useNavigate();
  useEffect(()=>{
  navigate('/avatar/dashboard');
    
  },[navigate])
  return null
}
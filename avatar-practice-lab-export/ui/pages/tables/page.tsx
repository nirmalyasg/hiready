
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import ModernDashboardLayout from '@/components/layout/modern-dashboard-layout';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/avatar/show-tables');
      const data = await response.json();

      if (data.success) {
        setTables(data.tables || []);
        setMessage(data.message || '');
      } else {
        setError(data.error || 'Failed to fetch tables');
      }
    } catch (error) {
      setError('Error connecting to database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    try {
      setLoading(true);
      setMessage('Creating tables...');

      const response = await fetch('/api/avatar/create-tables', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        fetchTables();
      } else {
        setError(data.error || 'Failed to create tables');
      }
    } catch (error) {
      setError('Error creating tables');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModernDashboardLayout>
  <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold mb-6">Database Tables Management</h1>

    {message && (
      <Card className="mb-4 border border-green-300 bg-green-100">
        <CardContent className="p-4">
          <p>{message}</p>
        </CardContent>
      </Card>
    )}

    {error && (
      <Card className="mb-4 border border-red-300 bg-red-100">
        <CardContent className="p-4">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )}

    <div className="mb-6 flex gap-4">
      <Button onClick={fetchTables}>Refresh Tables</Button>
      <Button variant="secondary" onClick={createTables}>
        Create/Update Tables
      </Button>
    </div>

    <Separator className="my-4" />

    {loading ? (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ) : (
      <>
        <h2 className="text-xl font-semibold mb-4">Available Tables</h2>

        {tables.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p>No tables found in database.</p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table, index) => (
                <TableRow key={index}>
                  <TableCell>{table}</TableCell>
                  <TableCell>
                    <Badge  >Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    )}
  </div>
    </ModernDashboardLayout>
      );
}
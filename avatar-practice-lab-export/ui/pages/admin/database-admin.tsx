import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Play, CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle, Rocket, Wrench, Zap, Code, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScriptResult {
  success: boolean;
  message: string;
  details?: string[];
  errors?: string[];
  totalStatements?: number;
  successCount?: number;
  errorCount?: number;
  results?: { statement: number; success: boolean; error?: string }[];
  failedSamples?: { statement: number; success: boolean; error?: string }[];
}

export default function DatabaseAdminPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [includeTransactionalData, setIncludeTransactionalData] = useState(true);
  const [customSql, setCustomSql] = useState('');

  const runDevMigrations = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    setIsRunning(true);
    setCurrentAction('dev-migrations');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/run-sql-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      setResult(await response.json());
    } catch (error) {
      setResult({ success: false, message: 'Failed to run migrations', details: [error instanceof Error ? error.message : 'Unknown error'] });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runDevSeeds = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    setIsRunning(true);
    setCurrentAction('dev-seeds');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/run-sql-seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      setResult(await response.json());
    } catch (error) {
      setResult({ success: false, message: 'Failed to run seeds', details: [error instanceof Error ? error.message : 'Unknown error'] });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runFullSetup = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    setIsRunning(true);
    setCurrentAction('full-setup');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/run-full-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      setResult(await response.json());
    } catch (error) {
      setResult({ success: false, message: 'Failed to run full setup', details: [error instanceof Error ? error.message : 'Unknown error'] });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runSeedScript = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    setIsRunning(true);
    setCurrentAction('seed');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/seed-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey, includeTransactionalData }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to run script',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runMigrateScript = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    setIsRunning(true);
    setCurrentAction('schema');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/migrate-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to run migration',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runFullDataMigration = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    const confirmed = window.confirm(
      'This will migrate ALL data from development to production database.\n\n' +
      'This includes:\n' +
      '- Creating all missing tables\n' +
      '- Migrating users, avatars, skills, scenarios\n' +
      '- Migrating all session data and transcripts\n' +
      '- Migrating presentation scenarios, sessions, and feedback\n\n' +
      'Are you sure you want to proceed?'
    );

    if (!confirmed) return;

    setIsRunning(true);
    setCurrentAction('full');
    setResult(null);

    try {
      const response = await fetch('/api/avatar/admin/full-data-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminKey }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to run full migration',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const runCustomSql = async () => {
    if (!adminKey) {
      setResult({ success: false, message: 'Admin key is required' });
      return;
    }

    if (!customSql.trim()) {
      setResult({ success: false, message: 'Please paste SQL statements to execute' });
      return;
    }

    const confirmed = window.confirm(
      `You are about to execute ${customSql.split(';').filter(s => s.trim()).length} SQL statement(s).\n\n` +
      'This will directly modify the database. Are you sure you want to proceed?'
    );

    if (!confirmed) return;

    setIsRunning(true);
    setCurrentAction('custom-sql');
    setResult(null);

    try {
      const response = await fetch('/api/admin/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ sqlStatements: customSql, adminKey }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to execute SQL',
        details: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsRunning(false);
      setCurrentAction('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCustomSql(text);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Database Administration</CardTitle>
                <CardDescription>Manage database migrations and seeding</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="sql-runner" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sql-runner" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              SQL Runner
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Development
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Production
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sql-runner" className="mt-4 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3 mb-4">
              <Code className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <strong>SQL Runner:</strong> Paste SQL statements from your database export file to seed the database. Each statement will be executed in order.
              </div>
            </div>

            <Card className="border-2 border-purple-300 bg-purple-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-purple-800">Execute Custom SQL</CardTitle>
                    <CardDescription className="text-purple-700">
                      Paste SQL INSERT statements to seed the database
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-purple-800">
                      SQL Statements
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload .sql file</span>
                      <input
                        type="file"
                        accept=".sql,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <textarea
                    value={customSql}
                    onChange={(e) => setCustomSql(e.target.value)}
                    placeholder="Paste your SQL statements here...

Example:
INSERT INTO public.avatars VALUES ('avatar_id', 'Wayne', NULL, NULL, 'male', NULL, 'https://example.com/avatar.webp', '2025-12-14', '2025-12-14');
INSERT INTO public.skills VALUES (1, 'Communication', 'Effective communication skills');"
                    className="w-full h-64 px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-y"
                  />
                  <div className="mt-2 text-xs text-purple-600">
                    {customSql.trim() ? (
                      <>Detected {customSql.split(';').filter(s => s.trim() && !s.trim().startsWith('--')).length} SQL statement(s)</>
                    ) : (
                      <>Paste SQL statements separated by semicolons</>
                    )}
                  </div>
                </div>
                <Button
                  onClick={runCustomSql}
                  disabled={isRunning || !customSql.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isRunning && currentAction === 'custom-sql' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Executing SQL...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Execute SQL Statements
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="development" className="mt-4 space-y-4">
            <Card className="border-2 border-blue-300 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-blue-800">Full Database Setup</CardTitle>
                    <CardDescription className="text-blue-700">
                      Run all SQL migrations and seeds on the development database
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-blue-800 space-y-1">
                  <p>This will run all migration files and seed data:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Execute all SQL migration files (001-007)</li>
                    <li>Seed users, skills, scenarios, avatars, personas, tones</li>
                    <li>Seed admin settings, budget guards, cultural presets</li>
                  </ul>
                </div>
                <Button
                  onClick={runFullSetup}
                  disabled={isRunning}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isRunning && currentAction === 'full-setup' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running Full Setup...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Run Full Setup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="text-sm text-slate-500 text-center">— Or run individually —</div>

            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">1. Run SQL Migrations</CardTitle>
                  <CardDescription>
                    Executes all SQL migration files from database/migrations/
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={runDevMigrations}
                    disabled={isRunning}
                    className="w-full"
                    variant="outline"
                  >
                    {isRunning && currentAction === 'dev-migrations' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Migrations...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run SQL Migrations
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">2. Run Seed Files</CardTitle>
                  <CardDescription>
                    Executes init.sql and cultural_presets.sql from database/seeds/
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={runDevSeeds}
                    disabled={isRunning}
                    className="w-full"
                    variant="outline"
                  >
                    {isRunning && currentAction === 'dev-seeds' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Seeds...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Seed Files
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="production" className="mt-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Warning:</strong> These scripts modify the production database. Only run them when setting up a new production environment.
              </div>
            </div>

            <Card className="border-2 border-orange-300 bg-orange-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-orange-800">Full Data Migration</CardTitle>
                    <CardDescription className="text-orange-700">
                      One-click migration of ALL data from development to production
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-orange-800 space-y-1">
                  <p>This comprehensive migration will:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Create all missing tables in production</li>
                    <li>Migrate users, avatars, skills, scenarios, tones, personas</li>
                    <li>Migrate cultural presets and custom scenarios</li>
                    <li>Migrate all session data, transcripts, and analysis</li>
                  </ul>
                </div>
                <Button
                  onClick={runFullDataMigration}
                  disabled={isRunning}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {isRunning && currentAction === 'full' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Running Full Migration...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Run Full Data Migration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="text-sm text-slate-500 text-center">— Or run individual steps —</div>

            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">1. Run Schema Migration</CardTitle>
                  <CardDescription>
                    Creates all database tables in production using Drizzle.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={runMigrateScript}
                    disabled={isRunning}
                    className="w-full"
                    variant="outline"
                  >
                    {isRunning && currentAction === 'schema' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Migration...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Schema Migration
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">2. Seed Production Data</CardTitle>
                  <CardDescription>
                    Populates the production database with initial data from seed files and optionally migrates transactional data from development.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={includeTransactionalData}
                      onChange={(e) => setIncludeTransactionalData(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-300"
                    />
                    <div className="text-sm">
                      <div className="font-medium text-slate-700">Include Transactional Data from Development</div>
                      <div className="text-slate-500 mt-1">
                        Migrates sessions, transcripts, analysis results, presentations, custom scenarios, API usage events, and more from your development database.
                      </div>
                    </div>
                  </label>
                  <Button
                    onClick={runSeedScript}
                    disabled={isRunning}
                    className="w-full"
                    variant="outline"
                  >
                    {isRunning && currentAction === 'seed' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Seeding Database...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Seed Production Database
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {result && (
          <Card className={`mt-6 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.successCount !== undefined && (
                    <div className="mt-2 text-sm">
                      <span className="text-green-700">{result.successCount} succeeded</span>
                      {result.errorCount && result.errorCount > 0 && (
                        <span className="text-red-700 ml-3">{result.errorCount} failed</span>
                      )}
                      <span className="text-slate-500 ml-3">of {result.totalStatements} total</span>
                    </div>
                  )}
                  {result.failedSamples && result.failedSamples.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">Failed Statement Samples (first 20):</p>
                      <div className="bg-red-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <ul className="text-xs space-y-1 font-mono">
                          {result.failedSamples.map((r, i) => (
                            <li key={i} className="text-red-700">
                              Statement {r.statement}: {r.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {result.results && result.results.length > 0 && !result.failedSamples && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-600 mb-2">Execution Results (first 50):</p>
                      <div className="bg-white/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <ul className="text-xs space-y-1 font-mono">
                          {result.results.map((r, i) => (
                            <li key={i} className={r.success ? 'text-green-700' : 'text-red-700'}>
                              Statement {r.statement}: {r.success ? 'OK' : `FAILED - ${r.error}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {result.details && result.details.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-600 mb-2">Migration Details:</p>
                      <div className="bg-white/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <ul className="text-xs space-y-1 font-mono">
                          {result.details.map((detail, i) => (
                            <li key={i} className="text-slate-700">
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                      <div className="bg-red-100 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <ul className="text-xs space-y-1 font-mono">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-red-700">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

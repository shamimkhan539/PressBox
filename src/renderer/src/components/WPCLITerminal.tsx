import React, { useState, useEffect, useRef } from 'react';

interface WPCLITerminalProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * WP-CLI Terminal Component
 * 
 * A terminal-like interface for executing WordPress CLI commands on sites
 */
export function WPCLITerminal({ siteId, siteName, isOpen, onClose }: WPCLITerminalProps) {
  const [history, setHistory] = useState<Array<{ command: string; result: CommandResult }>>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Common WP-CLI commands for suggestions
  const commonCommands = [
    'core version',
    'core update',
    'plugin list',
    'plugin install',
    'plugin activate',
    'plugin deactivate',
    'theme list',
    'theme install',
    'theme activate',
    'db query "SELECT * FROM wp_options WHERE option_name = \'siteurl\'"',
    'user list',
    'user create',
    'post list',
    'post create',
    'option get siteurl',
    'option update siteurl',
    'cache flush',
    'rewrite flush',
  ];

  useEffect(() => {
    if (isOpen) {
      // Add welcome message
      setHistory([{
        command: '-- WP-CLI Terminal Started --',
        result: {
          success: true,
          output: `Connected to WordPress site: ${siteName}\nType 'help' for available commands or use any WP-CLI command.\n`
        }
      }]);
      
      // Focus input when terminal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, siteName]);

  useEffect(() => {
    // Scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    
    try {
      let result: CommandResult;

      // Handle built-in commands
      if (command.toLowerCase() === 'help') {
        result = {
          success: true,
          output: `Available WP-CLI commands:
  
Core Commands:
  core version              Show WordPress version
  core update               Update WordPress core
  
Plugin Commands:
  plugin list              List all plugins
  plugin install <name>    Install a plugin
  plugin activate <name>   Activate a plugin
  plugin deactivate <name> Deactivate a plugin
  
Theme Commands:
  theme list               List all themes
  theme install <name>     Install a theme  
  theme activate <name>    Activate a theme
  
Database Commands:
  db query "<SQL>"         Execute SQL query
  option get <key>         Get option value
  option update <key> <value>  Update option value
  
User Commands:
  user list                List all users
  user create <login> <email>  Create new user
  
Post Commands:
  post list                List all posts
  post create              Create new post
  
Cache Commands:
  cache flush              Clear all caches
  rewrite flush            Flush rewrite rules

Type 'clear' to clear the terminal.
`
        };
      } else if (command.toLowerCase() === 'clear') {
        setHistory([]);
        setCurrentCommand('');
        setIsExecuting(false);
        return;
      } else {
        // Execute actual WP-CLI command
        result = await (window.electronAPI as any)['wp-cli'].execute(siteId, command);
      }

      // Add command and result to history
      setHistory(prev => [...prev, { command, result }]);
    } catch (error) {
      setHistory(prev => [...prev, {
        command,
        result: {
          success: false,
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }
      }]);
    }

    setCurrentCommand('');
    setIsExecuting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentCommand);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
        style={{ zIndex: 10001 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-4 text-white font-medium">WP-CLI Terminal - {siteName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Terminal Output */}
        <div 
          ref={terminalRef}
          className="flex-1 p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto"
        >
          {history.map((entry, index) => (
            <div key={index} className="mb-2">
              {/* Command */}
              <div className="flex items-start">
                <span className="text-blue-400 mr-2">$</span>
                <span className="text-white">{entry.command}</span>
              </div>
              
              {/* Output */}
              {entry.result.output && (
                <pre className="mt-1 ml-4 text-green-400 whitespace-pre-wrap">
                  {entry.result.output}
                </pre>
              )}
              
              {/* Error */}
              {entry.result.error && (
                <pre className="mt-1 ml-4 text-red-400 whitespace-pre-wrap">
                  {entry.result.error}
                </pre>
              )}
            </div>
          ))}
          
          {/* Current Command Input */}
          <div className="flex items-center">
            <span className="text-blue-400 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent text-white outline-none font-mono"
              placeholder={isExecuting ? "Executing..." : "Enter WP-CLI command..."}
              disabled={isExecuting}
              autoComplete="off"
            />
            {isExecuting && (
              <div className="ml-2 animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>

        {/* Quick Commands */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="mb-2 text-sm text-gray-400">Quick Commands:</div>
          <div className="flex flex-wrap gap-2">
            {commonCommands.slice(0, 8).map((cmd) => (
              <button
                key={cmd}
                onClick={() => setCurrentCommand(cmd)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                disabled={isExecuting}
              >
                {cmd}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Click a command to use it, or type your own. Press Enter to execute.
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  CommandLineIcon,
  ClockIcon,
  BookmarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

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

interface CommandHistory {
  command: string;
  result: CommandResult;
  timestamp: Date;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: string;
  example?: string;
}

/**
 * WP-CLI Terminal Component
 * 
 * A terminal-like interface for executing WordPress CLI commands on sites
 */
export function WPCLITerminal({ siteId, siteName, isOpen, onClose }: WPCLITerminalProps) {
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Comprehensive WP-CLI commands with descriptions
  const WP_CLI_COMMANDS: CommandSuggestion[] = [
    // Core commands
    { command: 'core version', description: 'Display the WordPress version', category: 'Core' },
    { command: 'core update', description: 'Update WordPress to the latest version', category: 'Core' },
    { command: 'core download', description: 'Download core WordPress files', category: 'Core' },
    { command: 'core config', description: 'Generate wp-config.php file', category: 'Core' },
    
    // Plugin commands
    { command: 'plugin list', description: 'List all plugins', category: 'Plugins' },
    { command: 'plugin activate', description: 'Activate a plugin', category: 'Plugins', example: 'plugin activate hello-dolly' },
    { command: 'plugin deactivate', description: 'Deactivate a plugin', category: 'Plugins', example: 'plugin deactivate hello-dolly' },
    { command: 'plugin install', description: 'Install a plugin', category: 'Plugins', example: 'plugin install woocommerce --activate' },
    { command: 'plugin uninstall', description: 'Uninstall a plugin', category: 'Plugins', example: 'plugin uninstall hello-dolly' },
    
    // Theme commands
    { command: 'theme list', description: 'List all themes', category: 'Themes' },
    { command: 'theme activate', description: 'Activate a theme', category: 'Themes', example: 'theme activate twentytwentyfour' },
    { command: 'theme install', description: 'Install a theme', category: 'Themes', example: 'theme install astra --activate' },
    
    // Database commands
    { command: 'db query', description: 'Execute a SQL query', category: 'Database', example: 'db query "SELECT * FROM wp_posts LIMIT 5"' },
    { command: 'db export', description: 'Export database', category: 'Database', example: 'db export backup.sql' },
    { command: 'db import', description: 'Import database', category: 'Database', example: 'db import backup.sql' },
    { command: 'db reset', description: 'Reset database', category: 'Database' },
    
    // User commands
    { command: 'user list', description: 'List all users', category: 'Users' },
    { command: 'user create', description: 'Create a user', category: 'Users', example: 'user create john john@example.com --role=editor' },
    { command: 'user update', description: 'Update user', category: 'Users', example: 'user update admin --user_pass=newpassword' },
    
    // Post commands
    { command: 'post list', description: 'List posts', category: 'Content' },
    { command: 'post create', description: 'Create a post', category: 'Content', example: 'post create --post_type=post --post_title="Hello World"' },
    { command: 'post delete', description: 'Delete posts', category: 'Content', example: 'post delete 123' },
    
    // Option commands
    { command: 'option list', description: 'List site options', category: 'Options' },
    { command: 'option get', description: 'Get option value', category: 'Options', example: 'option get siteurl' },
    { command: 'option update', description: 'Update option value', category: 'Options', example: 'option update blogname "My Site"' },
    
    // Cache commands
    { command: 'cache flush', description: 'Flush the object cache', category: 'Cache' },
    { command: 'rewrite flush', description: 'Flush rewrite rules', category: 'Cache' },
    
    // Search and replace
    { command: 'search-replace', description: 'Search and replace in database', category: 'Tools', example: 'search-replace "oldurl.com" "newurl.com"' },
  ];

  // Load history and bookmarks from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(`wpcli-history-${siteId}`);
    const savedBookmarks = localStorage.getItem(`wpcli-bookmarks-${siteId}`);
    
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.warn('Failed to parse command history');
      }
    }
    
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.warn('Failed to parse bookmarks');
      }
    }
  }, [siteId]);

  useEffect(() => {
    if (isOpen) {
      // Add welcome message if no history
      if (history.length === 0) {
        setHistory([{
          command: '-- WP-CLI Terminal Started --',
          result: {
            success: true,
            output: `Connected to WordPress site: ${siteName}\nType 'help' for available commands or use any WP-CLI command.\n`
          },
          timestamp: new Date()
        }]);
      }
      
      // Focus input when terminal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, siteName, history.length]);

  // Save history and bookmarks
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(`wpcli-history-${siteId}`, JSON.stringify(history.slice(-100))); // Keep last 100 commands
    }
  }, [history, siteId]);

  useEffect(() => {
    if (bookmarks.length > 0) {
      localStorage.setItem(`wpcli-bookmarks-${siteId}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, siteId]);

  // Filter suggestions based on current command
  useEffect(() => {
    if (currentCommand.trim()) {
      const filtered = WP_CLI_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().includes(currentCommand.toLowerCase()) ||
        cmd.description.toLowerCase().includes(currentCommand.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  }, [currentCommand]);

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
      setHistory(prev => [...prev, { command, result, timestamp: new Date() }]);
    } catch (error) {
      setHistory(prev => [...prev, {
        command,
        result: {
          success: false,
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        },
        timestamp: new Date()
      }]);
    }

    setCurrentCommand('');
    setIsExecuting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && selectedSuggestion >= 0) {
        e.preventDefault();
        setCurrentCommand(suggestions[selectedSuggestion].command);
        setShowSuggestions(false);
        return;
      }
      e.preventDefault();
      executeCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(Math.max(0, selectedSuggestion - 1));
      } else {
        // Navigate command history
        const commands = history.filter(h => !h.command.startsWith('--')).map(h => h.command);
        const newIndex = Math.min(commands.length - 1, historyIndex + 1);
        if (newIndex >= 0 && newIndex < commands.length) {
          setHistoryIndex(newIndex);
          setCurrentCommand(commands[commands.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(Math.min(suggestions.length - 1, selectedSuggestion + 1));
      } else {
        // Navigate command history
        if (historyIndex > 0) {
          const commands = history.filter(h => !h.command.startsWith('--')).map(h => h.command);
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(commands[commands.length - 1 - newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestion >= 0) {
        setCurrentCommand(suggestions[selectedSuggestion].command);
        setShowSuggestions(false);
      }
    }
  };

  const addBookmark = (cmd: string) => {
    if (!bookmarks.includes(cmd)) {
      setBookmarks(prev => [...prev, cmd]);
    }
  };

  const removeBookmark = (cmd: string) => {
    setBookmarks(prev => prev.filter(b => b !== cmd));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`wpcli-history-${siteId}`);
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
          <div className="flex items-center space-x-3">
            <CommandLineIcon className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-medium text-white">WP-CLI Terminal</h3>
              <p className="text-sm text-gray-400">{siteName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Clear History"
            >
              <ClockIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div 
          ref={terminalRef}
          className="flex-1 p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto"
        >
          {history.map((entry, index) => (
            <div key={index} className="mb-4">
              {/* Command with timestamp and actions */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">$</span>
                  <span className="text-white">{entry.command}</span>
                </div>
                {!entry.command.startsWith('--') && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => bookmarks.includes(entry.command) 
                        ? removeBookmark(entry.command) 
                        : addBookmark(entry.command)
                      }
                      className={`p-1 rounded ${
                        bookmarks.includes(entry.command)
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      title={bookmarks.includes(entry.command) ? 'Remove bookmark' : 'Add bookmark'}
                    >
                      <BookmarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Output */}
              {entry.result.output && (
                <pre className="mt-1 ml-4 text-green-400 whitespace-pre-wrap bg-gray-900 p-2 rounded">
                  {entry.result.output}
                </pre>
              )}
              
              {/* Error */}
              {entry.result.error && (
                <pre className="mt-1 ml-4 text-red-400 whitespace-pre-wrap bg-red-900/20 p-2 rounded border border-red-800">
                  {entry.result.error}
                </pre>
              )}
            </div>
          ))}
          
          {/* Current Command Input */}
          <div className="relative">
            <div className="flex items-center">
              <span className="text-blue-400 mr-2">$</span>
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white outline-none font-mono"
                placeholder={isExecuting ? "Executing..." : "Enter WP-CLI command..."}
                disabled={isExecuting}
                autoComplete="off"
              />
              {isExecuting && (
                <div className="ml-2 animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full left-6 right-0 mb-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentCommand(suggestion.command);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className={`w-full text-left p-3 hover:bg-gray-700 ${
                      index === selectedSuggestion ? 'bg-blue-900/20' : ''
                    } ${index === 0 ? 'rounded-t-lg' : ''} ${
                      index === suggestions.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-white">
                          {suggestion.command}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {suggestion.description}
                        </div>
                        {suggestion.example && (
                          <div className="text-xs text-blue-400 mt-1 font-mono">
                            Example: {suggestion.example}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs ml-2">
                        {suggestion.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <div className="p-3 bg-gray-800 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2 flex items-center space-x-2">
              <BookmarkIcon className="w-3 h-3" />
              <span>Bookmarks:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {bookmarks.map((bookmark, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentCommand(bookmark)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                  disabled={isExecuting}
                >
                  {bookmark}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Commands */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="mb-2 text-sm text-gray-400">Quick Commands:</div>
          <div className="flex flex-wrap gap-2">
            {WP_CLI_COMMANDS.slice(0, 8).map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => setCurrentCommand(cmd.command)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                disabled={isExecuting}
                title={cmd.description}
              >
                {cmd.command}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>
                Press <kbd className="px-1 bg-gray-700 text-gray-300 rounded">↑↓</kbd> to navigate history/suggestions, 
                <kbd className="px-1 bg-gray-700 text-gray-300 rounded ml-1">Tab</kbd> to autocomplete,
                <kbd className="px-1 bg-gray-700 text-gray-300 rounded ml-1">Enter</kbd> to execute
              </span>
              <span>{history.filter(h => !h.command.startsWith('--')).length} commands in history</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
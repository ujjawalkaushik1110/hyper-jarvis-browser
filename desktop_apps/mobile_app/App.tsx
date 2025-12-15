import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

const LLM_SERVER_URL = process.env.LLM_SERVER_URL || 'http://localhost:8000';

interface LLMResponse {
  choices: Array<{ text: string }>;
  error?: string;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  React.useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      const res = await fetch(`${LLM_SERVER_URL}/health`);
      setServerConnected(res.ok);
    } catch (error) {
      setServerConnected(false);
    }
  };

  const executeTask = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${LLM_SERVER_URL}/v1/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      const data: LLMResponse = await res.json();
      if (data.choices && data.choices[0]) {
        setResponse(data.choices[0].text);
      } else if (data.error) {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to LLM server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hyper-Jarvis Browser</Text>
        <Text
          style={[
            styles.serverStatus,
            { color: serverConnected ? '#4CAF50' : '#FF6B6B' },
          ]}
        >
          Server: {serverConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Browser Task</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your browser automation task..."
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, !serverConnected && styles.buttonDisabled]}
        onPress={executeTask}
        disabled={loading || !serverConnected}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Execute Task</Text>
        )}
      </TouchableOpacity>

      {response && (
        <View style={styles.outputSection}>
          <Text style={styles.label}>Response</Text>
          <Text style={styles.output}>{response}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  serverStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  outputSection: {
    marginVertical: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  output: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default App;

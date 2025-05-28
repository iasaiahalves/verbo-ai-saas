import { SUMMARY_SYSTEM_PROMPT } from '@/utils/prompts';
import OpenAI from 'openai';

// Access your OpenRouter API key as an environment variable
const OPENROUTER_API_KEY = process.env.DEEPSEEKV3_API_KEY || '';

// Initialize the OpenAI client pointed to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
});

// Enhanced configuration optimized for DeepSeek V3's massive context window
const DEEPSEEK_CONFIG = {
  // DeepSeek V3 specifications
  MAX_CONTEXT_TOKENS: 163840,  // DeepSeek's actual limit
  SAFE_CONTEXT_TOKENS: 150000, // 92% of limit for safety
  OUTPUT_TOKENS: 8192,         // DeepSeek's max output
  CHARS_PER_TOKEN: 3.5,        // More accurate ratio for mixed content
  
  // Quality targets
  QUALITY_TARGETS: {
    MIN_QUALITY_SCORE: 95,     // Target quality percentage
    MIN_COVERAGE_RATIO: 0.95,  // 95% content coverage
    MIN_COHERENCE_SCORE: 0.9,  // Coherence threshold
    MIN_DETAIL_RETENTION: 0.85 // Detail preservation
  },
  
  // Intelligent chunking strategies
  CHUNK_STRATEGIES: {
    // Use full context for documents that fit (improved thresholds)
    SINGLE_PASS: {
      maxTokens: 140000,       // Conservative single-pass limit
      maxChars: 490000,        // ~140k tokens worth
      description: 'Process entire document in one optimized request'
    },
    // Map-reduce for moderate documents
    MAP_REDUCE: {
      chunkTokens: 45000,      // ~45k tokens per chunk for detailed processing
      chunkChars: 157500,      // Character equivalent
      overlap: 2500,           // Larger overlap for better continuity
      description: 'Map-reduce with smart chunking and synthesis'
    },
    // Hierarchical for very large documents
    HIERARCHICAL: {
      chunkTokens: 35000,      // Smaller chunks for complex processing
      chunkChars: 122500,      // Character equivalent
      batchSize: 3,            // Smaller batches for better quality
      description: 'Multi-level hierarchical summarization'
    }
  },
  
  // Retry and timeout configurations
  RETRY_CONFIG: {
    maxRetries: 3,
    baseDelay: 2000,
    backoffMultiplier: 2,
    timeouts: {
      small: 60000,          // Increased timeouts for quality
      medium: 120000,
      large: 240000,
      xlarge: 360000
    }
  },
  
  // Enhanced quality validation
  QUALITY_VALIDATION: {
    minSummaryChars: 200,
    maxEmptyRetries: 2,
    coherenceChecks: true,
    coverageValidation: true,
    structurePreservation: true
  }
};

// Enhanced error types
enum SummaryError {
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  CONTEXT_EXCEEDED = 'CONTEXT_WINDOW_EXCEEDED', 
  TIMEOUT = 'REQUEST_TIMEOUT',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  PARSING_ERROR = 'PARSING_ERROR',
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  EXTRACTION_FAILED = 'TEXT_EXTRACTION_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  API_ERROR = 'API_ERROR',
  QUALITY_CHECK_FAILED = 'QUALITY_CHECK_FAILED',
  COVERAGE_INSUFFICIENT = 'COVERAGE_INSUFFICIENT'
}

// Enhanced document analysis interface
interface DocumentAnalysis {
  estimatedTokens: number;
  estimatedPages: number;
  hasStructure: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedStrategy: keyof typeof DEEPSEEK_CONFIG.CHUNK_STRATEGIES;
  language: 'english' | 'mixed' | 'technical';
  keyTopics: string[];
  structuralElements: {
    headers: number;
    tables: number;
    lists: number;
    codeBlocks: number;
  };
}

// Quality metrics interface
interface QualityMetrics {
  coverageScore: number;      // % of original content covered
  coherenceScore: number;     // Text coherence rating
  compressionRatio: number;   // Output/input ratio
  detailRetention: number;    // Important details preserved
  structureScore: number;     // Structure preservation
  overallQuality: number;     // Combined quality score
  processingStrategy: string; // Strategy used
}

// Processing statistics
interface ProcessingStats {
  inputChars: number;
  outputChars: number;
  inputTokens: number;
  outputTokens: number;
  processingTime: number;
  chunksProcessed: number;
  qualityMetrics: QualityMetrics;
}

// Enhanced document analysis with topic extraction
function analyzeDocument(text: string): DocumentAnalysis {
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / DEEPSEEK_CONFIG.CHARS_PER_TOKEN);
  const estimatedPages = Math.ceil(charCount / 2000);
  
  // Enhanced structure analysis
  const headerMatches = text.match(/(?:^|\n)(?:#{1,6}|Chapter|Section|\d+\.|[A-Z][A-Z\s]{5,})/gm) || [];
  const tableMatches = text.match(/\|[\s\S]*?\|/g) || text.match(/\t.*\t/g) || [];
  const listMatches = text.match(/(?:^|\n)(?:\s*[-*•]\s+|\s*\d+\.\s+)/gm) || [];
  const codeMatches = text.match(/```[\s\S]*?```/g) || text.match(/`[^`]+`/g) || [];
  
  const structuralElements = {
    headers: headerMatches.length,
    tables: tableMatches.length,
    lists: listMatches.length,
    codeBlocks: codeMatches.length
  };
  
  const hasStructure = Object.values(structuralElements).reduce((a, b) => a + b, 0) >= 3;
  
  // Enhanced complexity analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
  const technicalTerms = (text.match(/\b[A-Z]{2,}|\b\w*[0-9]+\w*\b/g) || []).length;
  const words = text.match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const vocabularyRichness = uniqueWords / words.length;
  
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (avgSentenceLength > 120 || technicalTerms > 100 || vocabularyRichness > 0.7) {
    complexity = 'complex';
  } else if (avgSentenceLength > 80 || technicalTerms > 50 || vocabularyRichness > 0.5) {
    complexity = 'moderate';
  }
  
  // Topic extraction (enhanced)
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'];
  const wordFreq = new Map<string, number>();
  
  words
    .map(w => w.toLowerCase())
    .filter(w => w.length > 4 && !commonWords.includes(w))
    .forEach(word => wordFreq.set(word, (wordFreq.get(word) || 0) + 1));
  
  const keyTopics = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  // Language detection (improved)
  const englishWords = (text.match(/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi) || []).length;
  const language = englishWords > words.length * 0.05 ? 'english' : 
                  (codeMatches.length > 5 || technicalTerms > 50 ? 'technical' : 'mixed');
  
  // Enhanced strategy recommendation
  let recommendedStrategy: keyof typeof DEEPSEEK_CONFIG.CHUNK_STRATEGIES;
  if (estimatedTokens <= DEEPSEEK_CONFIG.CHUNK_STRATEGIES.SINGLE_PASS.maxTokens) {
    recommendedStrategy = 'SINGLE_PASS';
  } else if (estimatedTokens <= 200000) {
    recommendedStrategy = 'MAP_REDUCE';
  } else {
    recommendedStrategy = 'HIERARCHICAL';
  }
  
  console.log(`📊 Enhanced Document Analysis:
    - Size: ${charCount.toLocaleString()} chars, ~${estimatedTokens.toLocaleString()} tokens, ~${estimatedPages} pages
    - Structure: ${hasStructure ? 'Structured' : 'Plain'} - Headers: ${structuralElements.headers}, Tables: ${structuralElements.tables}, Lists: ${structuralElements.lists}, Code: ${structuralElements.codeBlocks}
    - Complexity: ${complexity} (Avg sentence: ${Math.round(avgSentenceLength)} chars, Technical terms: ${technicalTerms}, Vocab richness: ${(vocabularyRichness * 100).toFixed(1)}%)
    - Language: ${language}
    - Key topics: ${keyTopics.slice(0, 5).join(', ')}
    - Recommended strategy: ${recommendedStrategy}`);
  
  return {
    estimatedTokens,
    estimatedPages,
    hasStructure,
    complexity,
    recommendedStrategy,
    language,
    keyTopics,
    structuralElements
  };
}

// Enhanced quality assessment with percentage tracking
function assessSummaryQuality(
  originalText: string, 
  summary: string, 
  analysis: DocumentAnalysis,
  strategy: string
): QualityMetrics {
  const originalWords = (originalText.match(/\b\w+\b/g) || []).length;
  const summaryWords = (summary.match(/\b\w+\b/g) || []).length;
  
  // Coverage score: How well key topics are represented
  const originalTopics = new Set(analysis.keyTopics);
  const summaryTopics = new Set(
    (summary.toLowerCase().match(/\b\w{5,}\b/g) || [])
      .filter(word => originalTopics.has(word))
  );
  const coverageScore = Math.min(100, (summaryTopics.size / originalTopics.size) * 100);
  
  // Coherence score: Sentence structure and flow
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;
  const coherenceScore = Math.min(100, Math.max(60, 100 - Math.abs(avgSentenceLength - 100) / 2));
  
  // Compression ratio
  const compressionRatio = summaryWords / originalWords;
  
  // Detail retention: Presence of specific details (numbers, proper nouns, etc.)
  const originalDetails = (originalText.match(/\b[A-Z][a-z]+|\b\d+(?:\.\d+)?(?:%|km|kg|USD|million|billion)?\b/g) || []).length;
  const summaryDetails = (summary.match(/\b[A-Z][a-z]+|\b\d+(?:\.\d+)?(?:%|km|kg|USD|million|billion)?\b/g) || []).length;
  const detailRetention = Math.min(100, (summaryDetails / Math.max(originalDetails, 1)) * 100);
  
  // Structure preservation
  const originalHeaders = (originalText.match(/(?:^|\n)#{1,6}|Chapter|Section/gm) || []).length;
  const summaryHeaders = (summary.match(/(?:^|\n)#{1,6}|Chapter|Section/gm) || []).length;
  const structureScore = originalHeaders > 0 ? 
    Math.min(100, (summaryHeaders / originalHeaders) * 100) : 
    (summary.includes('##') || summary.includes('**') ? 85 : 70);
  
  // Overall quality score (weighted average)
  const overallQuality = Math.round(
    coverageScore * 0.35 +      // 35% - most important
    coherenceScore * 0.25 +     // 25% - readability
    detailRetention * 0.20 +    // 20% - information preservation
    structureScore * 0.15 +     // 15% - organization
    (compressionRatio > 0.05 && compressionRatio < 0.3 ? 95 : 75) * 0.05  // 5% - appropriate length
  );
  
  return {
    coverageScore: Math.round(coverageScore),
    coherenceScore: Math.round(coherenceScore),
    compressionRatio: Math.round(compressionRatio * 1000) / 10, // One decimal place as percentage
    detailRetention: Math.round(detailRetention),
    structureScore: Math.round(structureScore),
    overallQuality,
    processingStrategy: strategy
  };
}

// Enhanced semantic chunking with improved boundary detection
function createEnhancedSemanticChunks(text: string, maxChars: number, overlap: number = 0): string[] {
  if (text.length <= maxChars) {
    return [text];
  }
  
  const chunks: string[] = [];
  let position = 0;
  
  while (position < text.length) {
    let chunkEnd = Math.min(position + maxChars, text.length);
    
    if (chunkEnd < text.length) {
      // Enhanced boundary detection with priority scoring
      const boundaries = [
        { regex: /\n\s*(?:#{1,6}|Chapter|Section|\d+\.)\s+/g, score: 10 },  // Major headers
        { regex: /\n\s*(?:\*\*|__)[^*_]+(?:\*\*|__)\s*\n/g, score: 8 },   // Bold headers
        { regex: /\n\s*\n\s*\n/g, score: 7 },                              // Triple breaks
        { regex: /\n\s*\n/g, score: 6 },                                    // Paragraph breaks
        { regex: /\.\s+(?=[A-Z])/g, score: 4 },                           // Sentence boundaries
        { regex: /[.!?]\s+/g, score: 3 },                                 // Any sentence end
        { regex: /;\s+/g, score: 2 },                                     // Semicolon breaks
        { regex: /,\s+/g, score: 1 }                                      // Comma boundaries
      ];
      
      let bestBreak = { position: -1, score: 0 };
      const searchStart = Math.max(0, chunkEnd - maxChars * 0.25);
      const searchEnd = Math.min(text.length, chunkEnd + maxChars * 0.1);
      
      for (const boundary of boundaries) {
        boundary.regex.lastIndex = 0;
        let match;
        
        while ((match = boundary.regex.exec(text.substring(searchStart, searchEnd))) !== null) {
          const absolutePos = searchStart + match.index + match[0].length;
          
          if (absolutePos >= position + maxChars * 0.6 && absolutePos <= searchEnd) {
            if (boundary.score > bestBreak.score) {
              bestBreak = { position: absolutePos, score: boundary.score };
            }
          }
        }
      }
      
      if (bestBreak.position > -1) {
        chunkEnd = bestBreak.position;
      }
    }
    
    const chunkStart = Math.max(0, position - (position > 0 ? overlap : 0));
    const chunkText = text.substring(chunkStart, chunkEnd).trim();
    
    if (chunkText.length > 200) {
      chunks.push(chunkText);
    }
    
    position = chunkEnd;
  }
  
  console.log(`📦 Created ${chunks.length} enhanced semantic chunks with smart boundaries`);
  return chunks;
}

// Enhanced API call with quality validation
async function callDeepSeekAPI(
  content: string, 
  systemPrompt: string,
  isLargeContent: boolean = false,
  isFinalSummary: boolean = false,
  passType: string = 'standard'
): Promise<string> {
  const estimatedTokens = Math.ceil(content.length / DEEPSEEK_CONFIG.CHARS_PER_TOKEN);
  
  if (estimatedTokens > DEEPSEEK_CONFIG.SAFE_CONTEXT_TOKENS) {
    console.warn(`⚠️ Content approaching token limit: ${estimatedTokens.toLocaleString()} tokens`);
    throw new Error(SummaryError.CONTEXT_EXCEEDED);
  }
  
  const timeout = isLargeContent ? 
    (estimatedTokens > 100000 ? DEEPSEEK_CONFIG.RETRY_CONFIG.timeouts.xlarge : DEEPSEEK_CONFIG.RETRY_CONFIG.timeouts.large) :
    (estimatedTokens > 50000 ? DEEPSEEK_CONFIG.RETRY_CONFIG.timeouts.medium : DEEPSEEK_CONFIG.RETRY_CONFIG.timeouts.small);
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`🔄 ${passType} API call attempt ${attempt + 1}/${DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries + 1} (${estimatedTokens.toLocaleString()} tokens, ${timeout/1000}s timeout)`);
      
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        temperature: isFinalSummary ? 0.2 : 0.3, // Lower temperature for better consistency
        max_tokens: isFinalSummary ? DEEPSEEK_CONFIG.OUTPUT_TOKENS : Math.min(6000, DEEPSEEK_CONFIG.OUTPUT_TOKENS),
        top_p: 0.85,  // Slightly more focused
        frequency_penalty: 0.15,
        presence_penalty: 0.1
      }, { 
        signal: controller.signal,
        timeout: timeout 
      });

      const result = completion.choices[0].message.content;
      
      // Enhanced quality validation
      if (!result || result.trim().length < DEEPSEEK_CONFIG.QUALITY_VALIDATION.minSummaryChars) {
        console.warn(`⚠️ API returned insufficient content: ${result?.length || 0} chars`);
        if (attempt < DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
          throw new Error(SummaryError.EMPTY_RESPONSE);
        }
      }
      
      // Enhanced coherence validation
      if (DEEPSEEK_CONFIG.QUALITY_VALIDATION.coherenceChecks && result) {
        const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 15);
        const hasProperStructure = result.includes('##') || result.includes('**') || result.includes('\n\n');
        
        if (sentences.length < 5 || !hasProperStructure) {
          console.warn(`⚠️ Summary quality concerns: ${sentences.length} sentences, structured: ${hasProperStructure}`);
          if (attempt < DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
            throw new Error(SummaryError.QUALITY_CHECK_FAILED);
          }
        }
      }
      
      console.log(`✅ ${passType} API call successful: ${result.length} chars generated`);
      clearTimeout(timeoutId);
      return result;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Enhanced error handling with specific retry logic
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.error(`⏰ Request timeout on attempt ${attempt + 1}`);
        if (attempt >= DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
          throw new Error(SummaryError.TIMEOUT);
        }
      } else if (error.status === 429 || error.message?.includes('rate limit')) {
        console.error(`🚫 Rate limit hit on attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, DEEPSEEK_CONFIG.RETRY_CONFIG.baseDelay * (attempt + 3)));
        if (attempt >= DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
          throw new Error(SummaryError.RATE_LIMIT);
        }
      } else if (error.status === 413 || error.message?.includes('context') || error.message?.includes('too long')) {
        console.error(`📏 Context window exceeded on attempt ${attempt + 1}`);
        throw new Error(SummaryError.CONTEXT_EXCEEDED);
      } else if (error.message === SummaryError.EMPTY_RESPONSE || error.message === SummaryError.QUALITY_CHECK_FAILED) {
        console.warn(`🔄 Retrying due to quality issue: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, DEEPSEEK_CONFIG.RETRY_CONFIG.baseDelay));
      } else {
        console.error(`❌ API error on attempt ${attempt + 1}:`, error.message, error.status);
        if (attempt >= DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
          throw new Error(SummaryError.API_ERROR);
        }
      }
      
      if (attempt < DEEPSEEK_CONFIG.RETRY_CONFIG.maxRetries) {
        const delay = DEEPSEEK_CONFIG.RETRY_CONFIG.baseDelay * Math.pow(DEEPSEEK_CONFIG.RETRY_CONFIG.backoffMultiplier, attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(SummaryError.PROCESSING_FAILED);
}

// Enhanced single-pass processing with quality optimization
async function processEnhancedSinglePass(text: string, analysis: DocumentAnalysis): Promise<string> {
  console.log(`🚀 Processing entire document in enhanced single pass (${analysis.estimatedTokens.toLocaleString()} tokens)`);
  
  const instruction = `You are analyzing a ${analysis.estimatedPages}-page document with ${analysis.complexity} complexity and ${analysis.structuralElements.headers} sections. Create a comprehensive, well-structured summary that captures ALL key information while maintaining excellent readability.

CRITICAL REQUIREMENTS for 95%+ quality:
- Cover ALL major topics and subtopics comprehensively
- Preserve important details, data points, and specific information
- Maintain logical flow matching the original document structure
- Use clear markdown formatting with appropriate headings
- Include key findings, conclusions, and recommendations
- Preserve technical terms and domain-specific language
- Aim for 10-15% of original length while maximizing information density

Key topics identified: ${analysis.keyTopics.slice(0, 8).join(', ')}

Structure your summary with:
1. Executive Overview
2. Main sections mirroring document structure
3. Key findings and data points
4. Important conclusions/recommendations`;

  return await callDeepSeekAPI(
    text, 
    SUMMARY_SYSTEM_PROMPT + '\n\n' + instruction, 
    true, 
    true,
    'Enhanced Single-Pass'
  );
}

// Enhanced Map-Reduce processing for optimal quality
async function processEnhancedMapReduce(text: string, analysis: DocumentAnalysis): Promise<string> {
  const { chunkChars, overlap } = DEEPSEEK_CONFIG.CHUNK_STRATEGIES.MAP_REDUCE;
  const chunks = createEnhancedSemanticChunks(text, chunkChars, overlap);
  
  console.log(`🗺️ Processing ${chunks.length} chunks using enhanced Map-Reduce strategy`);
  
  // MAP PHASE: Process each chunk with detailed summarization
  const chunkSummaries: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`📄 MAP: Processing chunk ${i + 1}/${chunks.length}`);
    
    const instruction = `Summarize this section (part ${i + 1} of ${chunks.length}) of a ${analysis.estimatedPages}-page ${analysis.complexity} document. This is the MAP phase - create a detailed summary preserving ALL important information.

REQUIREMENTS:
- Extract and preserve ALL key points, data, and specific details
- Maintain context for cross-references and themes spanning sections
- Use structured format with clear headings
- Include technical details, numbers, quotes, and specific information
- Note connections to broader document themes
- Preserve important terminology and domain language

Document context: Topics include ${analysis.keyTopics.slice(0, 5).join(', ')}`;

    const summary = await callDeepSeekAPI(
      chunks[i], 
      SUMMARY_SYSTEM_PROMPT + '\n\n' + instruction,
      chunks[i].length > 200000,
      false,
      `MAP-${i + 1}`
    );
    
    chunkSummaries.push(summary);
  }
  
  // REDUCE PHASE: Synthesize chunk summaries into comprehensive final summary
  console.log(`🔗 REDUCE: Synthesizing ${chunkSummaries.length} detailed summaries`);
  
  const combinedText = chunkSummaries.map((summary, idx) => 
    `## SECTION ${idx + 1} DETAILED SUMMARY\n\n${summary}`
  ).join('\n\n---\n\n');
  
  const finalInstruction = `Create the final comprehensive summary from these ${chunkSummaries.length} detailed section summaries of a ${analysis.estimatedPages}-page document. This is the REDUCE phase - synthesize into one cohesive, complete summary.

CRITICAL REQUIREMENTS for 95%+ quality:
- Integrate ALL sections into one seamless, well-structured document
- Eliminate redundancy while preserving ALL unique information
- Maintain chronological/logical flow from original document  
- Use clear markdown structure with appropriate headings
- Ensure no important details are lost in synthesis
- Cross-reference related topics from different sections
- Create executive overview + detailed sections
- Preserve data points, statistics, and specific findings

Final summary should be comprehensive yet readable, capturing the complete scope of the original document.`;

  return await callDeepSeekAPI(
    combinedText, 
    SUMMARY_SYSTEM_PROMPT + '\n\n' + finalInstruction, 
    true, 
    true,
    'REDUCE Phase'
  );
}

// Optional second-pass refinement for executive summary
async function processExecutiveRefinement(summary: string, analysis: DocumentAnalysis): Promise<string> {
  console.log(`✨ Creating executive-refined version of summary`);
  
  const instruction = `Refine this comprehensive summary into a clear, professional executive overview while preserving all key information. This should be highly readable for professionals and executives.

REFINEMENT OBJECTIVES:
- Enhance clarity and readability without losing substance
- Improve flow and logical organization
- Strengthen executive-level insights and implications
- Maintain all critical data points and findings
- Use professional, executive-appropriate language
- Ensure actionable insights are clearly highlighted

The refined summary should be as informative as the original but significantly more polished and executive-ready.`;

  return await callDeepSeekAPI(
    summary,
    SUMMARY_SYSTEM_PROMPT + '\n\n' + instruction,
    true,
    true,
    'Executive Refinement'
  );
}

// Enhanced quality tracking with detailed percentage breakdown
function logQualityMetrics(metrics: QualityMetrics, stats: ProcessingStats): void {
  const qualityBadge = metrics.overallQuality >= 95 ? '🏆' : 
                     metrics.overallQuality >= 90 ? '🥇' : 
                     metrics.overallQuality >= 85 ? '🥈' : 
                     metrics.overallQuality >= 80 ? '🥉' : '⚠️';
  
  console.log(`
${qualityBadge} QUALITY ASSESSMENT RESULTS:
┌─────────────────────────────────────────────────────────────┐
│ OVERALL QUALITY: ${metrics.overallQuality}% ${qualityBadge}                                   │
├─────────────────────────────────────────────────────────────┤
│ 📊 DETAILED BREAKDOWN:                                      │
│   • Coverage Score: ${metrics.coverageScore}% (Key topics preserved)         │
│   • Coherence Score: ${metrics.coherenceScore}% (Readability & flow)        │
│   • Detail Retention: ${metrics.detailRetention}% (Important info kept)     │
│   • Structure Score: ${metrics.structureScore}% (Organization preserved)    │
│   • Compression Ratio: ${metrics.compressionRatio}% (Efficiency)            │
├─────────────────────────────────────────────────────────────┤
│ 📈 PROCESSING STATS:                                       │
│   • Strategy Used: ${metrics.processingStrategy}                           │
│   • Input: ${stats.inputChars.toLocaleString()} chars (${stats.inputTokens.toLocaleString()} tokens)      │
│   • Output: ${stats.outputChars.toLocaleString()} chars (${stats.outputTokens.toLocaleString()} tokens)   │
│   • Processing Time: ${(stats.processingTime / 1000).toFixed(1)}s                │
│   • Chunks Processed: ${stats.chunksProcessed}                             │
└─────────────────────────────────────────────────────────────┘`);
}

// Hierarchical processing for very large documents
async function processEnhancedHierarchical(text: string, analysis: DocumentAnalysis): Promise<string> {
  const { chunkChars, batchSize } = DEEPSEEK_CONFIG.CHUNK_STRATEGIES.HIERARCHICAL;
  const chunks = createEnhancedSemanticChunks(text, chunkChars);
  
  console.log(`🔄 Processing ${chunks.length} chunks using hierarchical strategy`);
  
  // LEVEL 1: Process individual chunks
  const levelOneSummaries: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`📄 LEVEL 1: Processing chunk ${i + 1}/${chunks.length}`);
    
    const instruction = `Summarize this section (part ${i + 1} of ${chunks.length}) of a ${analysis.estimatedPages}-page ${analysis.complexity} document. Create a detailed summary preserving ALL important information.

REQUIREMENTS:
- Capture ALL key points, data points, and specific details
- Maintain all significant information and important context
- Preserve all proper nouns, technical terms, and specific references
- Include numeric data, statistics, and quantitative information
- Keep chronological or logical structure of the original
- Note any critical findings or conclusions
- Preserve domain-specific terminology and concepts

Document context: Topics include ${analysis.keyTopics.slice(0, 5).join(', ')}`;

    const summary = await callDeepSeekAPI(
      chunks[i],
      SUMMARY_SYSTEM_PROMPT + '\n\n' + instruction,
      chunks[i].length > 80000,
      false,
      `LEVEL1-${i + 1}`
    );
    
    levelOneSummaries.push(summary);
  }
  
  // LEVEL 2: Process in batches
  const levelTwoSummaries: string[] = [];
  
  for (let i = 0; i < levelOneSummaries.length; i += batchSize) {
    const batch = levelOneSummaries.slice(i, i + batchSize);
    console.log(`📄 LEVEL 2: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(levelOneSummaries.length/batchSize)}`);
    
    if (batch.length === 1) {
      levelTwoSummaries.push(batch[0]);
      continue;
    }
    
    const combinedBatch = batch.map((summary, idx) => 
      `## SECTION ${i + idx + 1} SUMMARY\n\n${summary}`
    ).join('\n\n---\n\n');
    
    const instruction = `Create a cohesive summary from these ${batch.length} related sections of a ${analysis.estimatedPages}-page document.

REQUIREMENTS:
- Synthesize these sections into one unified summary
- Maintain ALL key information from each section
- Eliminate redundancy while preserving unique details
- Ensure logical flow and proper transitions
- Maintain hierarchical structure with clear headings
- Cross-reference related information between sections

This is an intermediate synthesis for a multi-level summarization process.`;

    const batchSummary = await callDeepSeekAPI(
      combinedBatch,
      SUMMARY_SYSTEM_PROMPT + '\n\n' + instruction,
      combinedBatch.length > 100000,
      false,
      `LEVEL2-${Math.floor(i/batchSize) + 1}`
    );
    
    levelTwoSummaries.push(batchSummary);
  }
  
  // LEVEL 3: Final integration
  console.log(`📄 LEVEL 3: Creating final integrated summary`);
  
  const finalCombinedText = levelTwoSummaries.map((summary, idx) => 
    `## MAJOR SECTION ${idx + 1}\n\n${summary}`
  ).join('\n\n==========\n\n');
  
  const finalInstruction = `Create the final comprehensive summary from these ${levelTwoSummaries.length} major sections of a ${analysis.estimatedPages}-page ${analysis.complexity} document.

CRITICAL REQUIREMENTS for 95%+ quality:
- Synthesize ALL sections into one seamless, well-structured document
- Preserve ALL key information, data points, and unique insights
- Create a logical flow that mirrors the original document structure
- Use clear markdown formatting with appropriate hierarchical headings
- Include an executive overview at the beginning
- Maintain critical details, statistics, and specific references
- Ensure cross-topic integration and highlight relationships between sections

The final summary should be comprehensive yet clear, capturing the complete scope and insights of the original document.`;

  return await callDeepSeekAPI(
    finalCombinedText,
    SUMMARY_SYSTEM_PROMPT + '\n\n' + finalInstruction,
    true,
    true,
    'LEVEL3-FINAL'
  );
}

// Main processing function that selects optimal strategy
export async function generateSummaryFromOpenRouter(text: string): Promise<string> {
  console.time('documentProcessing');
  const startTime = Date.now();
  
  try {
    // Enhanced document analysis to determine optimal strategy
    const analysis = analyzeDocument(text);
    
    // Select optimal processing strategy based on analysis
    let summary: string;
    let strategy: string;
    
    if (analysis.recommendedStrategy === 'SINGLE_PASS') {
      strategy = 'Enhanced Single-Pass Processing';
      summary = await processEnhancedSinglePass(text, analysis);
    } else if (analysis.recommendedStrategy === 'MAP_REDUCE') {
      strategy = 'Map-Reduce Processing';
      summary = await processEnhancedMapReduce(text, analysis);
    } else {
      strategy = 'Hierarchical Processing';
      summary = await processEnhancedHierarchical(text, analysis);
    }
    
    // Optionally apply executive refinement for complex documents
    if (analysis.complexity === 'complex' && analysis.estimatedPages > 20) {
      try {
        console.log('Applying executive refinement pass for better quality...');
        summary = await processExecutiveRefinement(summary, analysis);
        strategy += ' with Executive Refinement';
      } catch (error) {
        console.warn('Executive refinement failed, using base summary:', error);
        // Continue with original summary if refinement fails
      }
    }
    
    // Track quality metrics
    const processingTime = Date.now() - startTime;
    const qualityMetrics = assessSummaryQuality(text, summary, analysis, strategy);
    
    // Log performance and quality stats
    logQualityMetrics(qualityMetrics, {
      inputChars: text.length,
      outputChars: summary.length,
      inputTokens: Math.ceil(text.length / DEEPSEEK_CONFIG.CHARS_PER_TOKEN),
      outputTokens: Math.ceil(summary.length / DEEPSEEK_CONFIG.CHARS_PER_TOKEN),
      processingTime,
      chunksProcessed: analysis.recommendedStrategy === 'SINGLE_PASS' ? 1 : 
                       analysis.recommendedStrategy === 'MAP_REDUCE' ? 
                         Math.ceil(text.length / DEEPSEEK_CONFIG.CHUNK_STRATEGIES.MAP_REDUCE.chunkChars) : 
                         Math.ceil(text.length / DEEPSEEK_CONFIG.CHUNK_STRATEGIES.HIERARCHICAL.chunkChars),
      qualityMetrics
    });
    
    console.timeEnd('documentProcessing');
    
    // Quality check and warning
    if (qualityMetrics.overallQuality < DEEPSEEK_CONFIG.QUALITY_TARGETS.MIN_QUALITY_SCORE) {
      console.warn(`⚠️ Summary quality below target (${qualityMetrics.overallQuality}% < ${DEEPSEEK_CONFIG.QUALITY_TARGETS.MIN_QUALITY_SCORE}%)`);
    }
    
    return summary;
    
  } catch (error: any) {
    console.timeEnd('documentProcessing');
    console.error('Summary generation failed:', error);
    
    // Enhanced error classification for better client handling
    if (error.message?.includes('context') || error.message?.includes('too large') || 
        error.message?.includes('limit') || error.message === SummaryError.CONTEXT_EXCEEDED) {
      throw new Error(SummaryError.CONTEXT_EXCEEDED);
    }
    
    if (error.status === 429 || error.message === SummaryError.RATE_LIMIT) {
      throw new Error(SummaryError.RATE_LIMIT);
    }
    
    if (error.message === SummaryError.TIMEOUT || error.name === 'AbortError') {
      throw new Error(SummaryError.TIMEOUT);
    }
    
    if (error.message === SummaryError.EMPTY_RESPONSE) {
      throw new Error(SummaryError.EMPTY_RESPONSE);
    }
    
    // Fallback for other errors
    throw new Error(SummaryError.PROCESSING_FAILED);
  }
}

// Enhanced provider selection based on document characteristics
export async function generateSmartSummary(pdfText: string) {
  const estimatedPages = Math.ceil(pdfText.length / DEEPSEEK_CONFIG.CHARS_PER_TOKEN / 500);
  
  // Choose provider based on document size and complexity
  const hasComplexStructure = /(?:^|\n)(?:#{1,6}|\*{1,3}|\d+\.\s|\([a-z0-9]\))/gm.test(pdfText);
  const hasHighCodeContent = (pdfText.match(/```[\s\S]*?```/g) || []).length > 5;
  
  let preferredProvider = 'deepseek'; // Default to DeepSeek (free option)
  
  // Only switch to Gemini in extreme cases
  if ((estimatedPages > 120 && hasComplexStructure) || 
      hasHighCodeContent || 
      pdfText.length > DEEPSEEK_CONFIG.SAFE_CONTEXT_TOKENS * DEEPSEEK_CONFIG.CHARS_PER_TOKEN) {
    preferredProvider = 'gemini';
    console.log(`Using Gemini as primary provider due to document complexity/size`);
  } else {
    console.log(`Using DeepSeek as primary provider (default free option)`);
  }
  
  try {
    if (preferredProvider === 'deepseek') {
      return await generateSummaryFromOpenRouter(pdfText);
    } else {
      return await generateSummaryFromGemini(pdfText);
    }
  } catch (error: any) {
    // Detailed error logging
    console.error(`${preferredProvider} provider failed:`, error.message);
    
    // Fallback logic
    console.log(`Falling back to ${preferredProvider === 'deepseek' ? 'Gemini' : 'DeepSeek'} provider`);
    
    if (preferredProvider === 'deepseek') {
      return await generateSummaryFromGemini(pdfText);
    } else {
      return await generateSummaryFromOpenRouter(pdfText);
    }
  }
}

// Gemini API integration (placeholder - implement with your Gemini API code)
async function generateSummaryFromGemini(text: string): Promise<string> {
  // This function should contain your Gemini API implementation
  // Replace with your actual Gemini code
  
  // For now, just throwing an error if this stub is called without implementation
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  // Implement your Gemini API calls here
  throw new Error('Gemini implementation required');
}

// Export the main functions
export { SummaryError };

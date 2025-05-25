"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var openai_1 = require("openai");
// Initialize Supabase client
var supabase = (0, supabase_js_1.createClient)("https://anxhpmvpzlvlkylttzub.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueGhwbXZwemx2bGt5bHR0enViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTA2MjMsImV4cCI6MjA2MzYyNjYyM30.ngKFH2gRAaIcoJn2fz7wnOTxEV8xT_RONUw225ZJNsw");
// Initialize OpenAI client
var openai = new openai_1.default({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "AI Task Manager",
    },
});
function generateEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, openai.embeddings.create({
                            model: "text-embedding-3-small",
                            input: text,
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data[0].embedding];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error generating embedding:', error_1);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function findSimilarMessages(currentEmbedding_1, senderId_1, receiverId_1) {
    return __awaiter(this, arguments, void 0, function (currentEmbedding, senderId, receiverId, limit) {
        var _a, messages, error, similarities, error_2;
        if (limit === void 0) { limit = 5; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .select('content, embedding, created_at')
                            .or("and(sender_id.eq.".concat(senderId, ",receiver_id.eq.").concat(receiverId, "),and(sender_id.eq.").concat(receiverId, ",receiver_id.eq.").concat(senderId, ")"))
                            .not('embedding', 'is', null)
                            .limit(50)];
                case 1:
                    _a = _b.sent(), messages = _a.data, error = _a.error;
                    if (error || !messages) {
                        console.error('Error fetching messages for similarity:', error);
                        return [2 /*return*/, []];
                    }
                    similarities = messages.map(function (msg) {
                        if (!msg.embedding || !Array.isArray(msg.embedding))
                            return null;
                        var similarity = cosineSimilarity(currentEmbedding, msg.embedding);
                        return {
                            content: msg.content,
                            similarity: similarity,
                            timestamp: msg.created_at
                        };
                    }).filter(Boolean);
                    // Sort by similarity and return top results
                    return [2 /*return*/, similarities
                            .sort(function (a, b) { return (b.similarity || 0) - (a.similarity || 0); })
                            .slice(0, limit)];
                case 2:
                    error_2 = _b.sent();
                    console.error('Error finding similar messages:', error_2);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    var dotProduct = 0;
    var normA = 0;
    var normB = 0;
    for (var i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
function extractTaskFromEmbeddings(currentMessage_1) {
    return __awaiter(this, arguments, void 0, function (currentMessage, similarMessages) {
        var contextString, completion, response, parsed, error_3;
        var _a, _b;
        if (similarMessages === void 0) { similarMessages = []; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    contextString = similarMessages.length > 0
                        ? similarMessages.map(function (msg, i) { var _a; return "Context ".concat(i + 1, " (similarity: ").concat(((_a = msg.similarity) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'N/A', "): \"").concat(msg.content, "\""); }).join('\n')
                        : "No similar context available.";
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: "meta-llama/llama-3.3-8b-instruct:free",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a task extraction AI. Your job is to analyze messages and extract actionable tasks with priorities.\n\nPRIORITY LEVELS:\n- urgent: Critical, time-sensitive, needs immediate attention\n- high: Important, deadline within 24-48 hours\n- medium: Moderate importance, can wait a few days\n- low: Nice to have, no strict deadline\n\nEXTRACTION RULES:\n1. Only extract if there's a clear, actionable task\n2. Be specific about what needs to be done\n3. Consider context from similar messages\n4. If no task is found, return null\n\nRESPONSE FORMAT (JSON only):\n{\n  \"task\": \"specific actionable task or null\",\n  \"priority\": \"low|medium|high|urgent or null\",\n  \"confidence\": 0.0-1.0,\n  \"reasoning\": \"brief explanation of priority decision\"\n}"
                                },
                                {
                                    role: "user",
                                    content: "CURRENT MESSAGE: \"".concat(currentMessage, "\"\n\nSIMILAR CONTEXT FROM CHAT HISTORY:\n").concat(contextString, "\n\nExtract the task and priority from the current message, using the context to better understand urgency and importance. Respond with JSON only.")
                                }
                            ],
                            temperature: 0.3,
                            max_tokens: 300
                        })];
                case 1:
                    completion = _c.sent();
                    response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                    if (!response) {
                        throw new Error('No response from AI');
                    }
                    parsed = JSON.parse(response.trim());
                    // Validate response
                    if (!parsed.task || parsed.task === 'null' || parsed.task.toLowerCase() === 'null') {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, parsed];
                case 2:
                    error_3 = _c.sent();
                    console.error('Error extracting task:', error_3);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function saveTask(task) {
    return __awaiter(this, void 0, void 0, function () {
        var error, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase
                            .from('tasks')
                            .insert([task])];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error('Error saving task:', error);
                        return [2 /*return*/, false];
                    }
                    console.log('Task saved successfully:', task.content);
                    return [2 /*return*/, true];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error saving task:', error_4);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function processMessage(message) {
    return __awaiter(this, void 0, void 0, function () {
        var embedding, similarMessages, taskExtraction, task, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    console.log('Processing message:', message.id);
                    embedding = message.embedding;
                    if (!(!embedding || embedding.length === 0)) return [3 /*break*/, 3];
                    console.log('Generating embedding for message...');
                    return [4 /*yield*/, generateEmbedding(message.content)];
                case 1:
                    embedding = _a.sent();
                    if (!(embedding.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .update({ embedding: embedding })
                            .eq('id', message.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, findSimilarMessages(embedding, message.sender_id, message.receiver_id)];
                case 4:
                    similarMessages = _a.sent();
                    return [4 /*yield*/, extractTaskFromEmbeddings(message.content, similarMessages)];
                case 5:
                    taskExtraction = _a.sent();
                    if (!taskExtraction) return [3 /*break*/, 7];
                    console.log('Task extracted:', taskExtraction);
                    task = {
                        content: taskExtraction.task,
                        priority: taskExtraction.priority,
                        confidence: taskExtraction.confidence,
                        reasoning: taskExtraction.reasoning,
                        message_id: message.id,
                        sender_id: message.sender_id,
                        receiver_id: message.receiver_id,
                        status: 'pending'
                    };
                    // Save task to database
                    return [4 /*yield*/, saveTask(task)];
                case 6:
                    // Save task to database
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    console.log('No task found in message:', message.content);
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_5 = _a.sent();
                    console.error('Error processing message:', error_5);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function startWorker() {
    return __awaiter(this, void 0, void 0, function () {
        var subscription, _a, existingMessages, error, _i, existingMessages_1, message;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Starting message worker...');
                    subscription = supabase
                        .channel('messages_channel')
                        .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages'
                    }, function (payload) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('New message event:', payload.eventType);
                                    return [4 /*yield*/, processMessage(payload.new)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })
                        .subscribe();
                    console.log('Subscription status:', subscription);
                    // Process existing messages that haven't been processed
                    console.log('Processing existing messages...');
                    return [4 /*yield*/, supabase
                            .from('messages')
                            .select('*')
                            .is('embedding', null) // Only process messages without embeddings
                            .order('created_at', { ascending: true })
                            .limit(100)];
                case 1:
                    _a = _b.sent(), existingMessages = _a.data, error = _a.error;
                    if (!error) return [3 /*break*/, 2];
                    console.error('Error fetching existing messages:', error);
                    return [3 /*break*/, 9];
                case 2:
                    if (!(existingMessages && existingMessages.length > 0)) return [3 /*break*/, 8];
                    console.log("Processing ".concat(existingMessages.length, " existing messages..."));
                    _i = 0, existingMessages_1 = existingMessages;
                    _b.label = 3;
                case 3:
                    if (!(_i < existingMessages_1.length)) return [3 /*break*/, 7];
                    message = existingMessages_1[_i];
                    return [4 /*yield*/, processMessage(message)];
                case 4:
                    _b.sent();
                    // Add small delay to avoid rate limiting
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 5:
                    // Add small delay to avoid rate limiting
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7:
                    console.log('Finished processing existing messages');
                    return [3 /*break*/, 9];
                case 8:
                    console.log('No unprocessed messages found');
                    _b.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Start the worker
startWorker().catch(console.error);
// Handle graceful shutdown
process.on('SIGINT', function () {
    console.log('Shutting down worker...');
    process.exit(0);
});
process.on('SIGTERM', function () {
    console.log('Shutting down worker...');
    process.exit(0);
});

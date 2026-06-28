import type { Task, Memory, Tool, Plugin, Workflow, Notification, LLMLog, ToolLog, CostSummary } from "@/types"

export const mockTasks: Task[] = [
  {id:"t1",goal:"Search web for latest AI news and summarize",status:"done",result:"Found 10 articles about GPT-5, Gemini Ultra. Summary written to file.",steps:[{step:1,title:"Web Search",description:"Search for AI news",tool:"web_search",success:true,duration_ms:1200},{step:2,title:"Summarize",description:"Summarize results",success:true,duration_ms:800}],created_at:"2025-01-15T10:30:00Z",completed_at:"2025-01-15T10:32:00Z",tools_used:["web_search"],provider_used:"groq",cost_usd:0.0012,tokens_used:1840},
  {id:"t2",goal:"Write a Python script to sort a list",status:"done",result:"Script written to workspace/sort_list.py",steps:[{step:1,title:"Write Code",description:"Write Python sorting script",success:true,duration_ms:600},{step:2,title:"Run Code",description:"Execute and verify",tool:"run_code",success:true,duration_ms:400}],created_at:"2025-01-15T11:00:00Z",completed_at:"2025-01-15T11:01:00Z",tools_used:["run_code","write_file"],provider_used:"deepseek",cost_usd:0.0008,tokens_used:920},
  {id:"t3",goal:"Scrape top 5 Python libraries for data science",status:"running",steps:[{step:1,title:"Search",description:"Search for libraries",tool:"web_search",success:true,duration_ms:900},{step:2,title:"Scrape Details",description:"Get library details",tool:"web_scrape"}],created_at:"2025-01-15T12:00:00Z",tools_used:["web_search","web_scrape"],provider_used:"gemini",cost_usd:0.0005,tokens_used:540},
  {id:"t4",goal:"Analyze CSV file and generate report",status:"failed",error:"File not found: data.csv",steps:[{step:1,title:"Read File",description:"Read CSV file",tool:"read_file",success:false,error:"File not found"}],created_at:"2025-01-15T09:00:00Z",tools_used:[],provider_used:"groq",cost_usd:0.0001,tokens_used:120},
  {id:"t5",goal:"Generate weekly summary report",status:"pending",steps:[],created_at:"2025-01-15T13:00:00Z"},
]

export const mockMemories: Memory[] = [
  {id:"m1",content:"User prefers concise answers in bullet points",type:"general",timestamp:"2025-01-14T10:00:00Z"},
  {id:"m2",content:"[SUCCESS] Goal: Search web for AI news | Result: Found 10 articles",type:"task_episode",timestamp:"2025-01-15T10:32:00Z"},
  {id:"m3",content:"Python 3.11 is preferred for scripts",type:"general",timestamp:"2025-01-13T15:00:00Z"},
  {id:"m4",content:"Chat: What is machine learning? → Explained supervised/unsupervised learning",type:"chat",timestamp:"2025-01-12T09:00:00Z"},
  {id:"m5",content:"Groq is fastest for general tasks, DeepSeek best for coding",type:"general",timestamp:"2025-01-11T14:00:00Z"},
]

export const mockTools: Tool[] = [
  {name:"web_search",description:"Search the internet using Google",category:"web",enabled:true,call_count:245,success_rate:96,avg_duration_ms:1100,last_used:"2025-01-15T12:00:00Z"},
  {name:"web_scrape",description:"Scrape content from any webpage",category:"web",enabled:true,call_count:132,success_rate:89,avg_duration_ms:2300},
  {name:"run_code",description:"Execute Python code",category:"code",enabled:true,call_count:198,success_rate:94,avg_duration_ms:850},
  {name:"read_file",description:"Read files from disk",category:"file",enabled:true,call_count:87,success_rate:99,avg_duration_ms:120},
  {name:"write_file",description:"Write content to files",category:"file",enabled:true,call_count:76,success_rate:98,avg_duration_ms:150},
  {name:"run_shell",description:"Execute shell commands",category:"system",enabled:true,call_count:54,success_rate:87,avg_duration_ms:450},
  {name:"calculate",description:"Math calculations",category:"code",enabled:true,call_count:34,success_rate:100,avg_duration_ms:50},
  {name:"image_gen",description:"Generate images with AI",category:"media",enabled:true,call_count:18,success_rate:91,avg_duration_ms:5500},
  {name:"youtube_search",description:"Search YouTube videos",category:"web",enabled:true,call_count:23,success_rate:95,avg_duration_ms:900},
  {name:"browser_open",description:"Open URL in browser",category:"web",enabled:false,call_count:12,success_rate:83,avg_duration_ms:3200},
  {name:"email_tool",description:"Send emails",category:"communication",enabled:false,call_count:5,success_rate:100,avg_duration_ms:800},
  {name:"github_tool",description:"GitHub integration",category:"developer",enabled:false,call_count:0,success_rate:0,avg_duration_ms:0},
]

export const mockPlugins: Plugin[] = [
  {id:"p1",name:"Notion Integration",description:"Connect Maya to Notion for note-taking",version:"1.2.0",author:"MayaTeam",category:"Productivity",enabled:true,installed:true,tools:["notion_read","notion_write"],rating:4.8,downloads:1240,tags:["productivity","notes"]},
  {id:"p2",name:"Slack Bot",description:"Send messages to Slack channels",version:"2.0.1",author:"Community",category:"Communication",enabled:false,installed:true,tools:["slack_send","slack_read"],rating:4.5,downloads:890,tags:["communication","team"]},
  {id:"p3",name:"GitHub Bridge",description:"GitHub code management and PR automation",version:"1.0.0",author:"DevTools",category:"Developer",enabled:false,installed:false,tools:["github_create_pr","github_commit"],rating:4.9,downloads:2100,tags:["code","github"]},
  {id:"p4",name:"Weather Tool",description:"Get real-time weather data",version:"1.1.0",author:"Community",category:"Utility",enabled:false,installed:false,tools:["get_weather"],rating:4.2,downloads:560,tags:["weather","utility"]},
]

export const mockWorkflows: Workflow[] = [
  {id:"w1",name:"Daily News Digest",description:"Search, summarize and save daily AI news",nodes:[],edges:[],created_at:"2025-01-10T00:00:00Z",updated_at:"2025-01-15T00:00:00Z",run_count:15,last_run:"2025-01-15T08:00:00Z"},
  {id:"w2",name:"Code Review Bot",description:"Automatically review and suggest improvements",nodes:[],edges:[],created_at:"2025-01-12T00:00:00Z",updated_at:"2025-01-14T00:00:00Z",run_count:7},
]

export const mockNotifications: Notification[] = [
  {id:"n1",type:"success",title:"Task Completed",message:"AI news search completed successfully",timestamp:"2025-01-15T10:32:00Z",read:false,task_id:"t1"},
  {id:"n2",type:"error",title:"Task Failed",message:"File not found: data.csv",timestamp:"2025-01-15T09:01:00Z",read:false,task_id:"t4"},
  {id:"n3",type:"warning",title:"Budget Alert",message:"You have used 80% of your $1.00 budget",timestamp:"2025-01-15T08:00:00Z",read:true},
  {id:"n4",type:"info",title:"Provider Offline",message:"OpenAI provider is temporarily unavailable",timestamp:"2025-01-14T22:00:00Z",read:true},
]

export const mockLLMLogs: LLMLog[] = [
  {id:"l1",timestamp:"2025-01-15T12:00:00Z",provider:"groq",model:"llama-3.3-70b-versatile",input_tokens:850,output_tokens:420,total_tokens:1270,cost_usd:0.00089,response_time_ms:1240,task_id:"t1",success:true},
  {id:"l2",timestamp:"2025-01-15T11:00:00Z",provider:"deepseek",model:"deepseek-coder",input_tokens:620,output_tokens:300,total_tokens:920,cost_usd:0.00061,response_time_ms:980,task_id:"t2",success:true},
  {id:"l3",timestamp:"2025-01-15T10:00:00Z",provider:"gemini",model:"gemini-1.5-flash",input_tokens:400,output_tokens:140,total_tokens:540,cost_usd:0.00007,response_time_ms:750,task_id:"t3",success:true},
]

export const mockToolLogs: ToolLog[] = [
  {id:"tl1",timestamp:"2025-01-15T12:01:00Z",tool_name:"web_search",input:{query:"latest AI news 2025"},output:"Found 10 results...",success:true,duration_ms:1100,task_id:"t1"},
  {id:"tl2",timestamp:"2025-01-15T11:00:30Z",tool_name:"run_code",input:{code:"print(sorted([3,1,2]))"},output:"[1, 2, 3]",success:true,duration_ms:340,task_id:"t2"},
  {id:"tl3",timestamp:"2025-01-15T09:00:10Z",tool_name:"read_file",input:{path:"data.csv"},success:false,duration_ms:50,task_id:"t4",error:"File not found"},
]

export const mockAnalytics = {
  daily_tasks:[
    {date:"2025-01-09",success:8,failed:2,total:10},
    {date:"2025-01-10",success:12,failed:1,total:13},
    {date:"2025-01-11",success:6,failed:3,total:9},
    {date:"2025-01-12",success:15,failed:0,total:15},
    {date:"2025-01-13",success:10,failed:2,total:12},
    {date:"2025-01-14",success:18,failed:1,total:19},
    {date:"2025-01-15",success:9,failed:2,total:11},
  ],
  cost_over_time:[
    {date:"2025-01-09",cost:0.08},{date:"2025-01-10",cost:0.12},
    {date:"2025-01-11",cost:0.07},{date:"2025-01-12",cost:0.15},
    {date:"2025-01-13",cost:0.11},{date:"2025-01-14",cost:0.18},{date:"2025-01-15",cost:0.09},
  ],
  provider_usage:[
    {provider:"groq",calls:312,cost:0.28,tokens:425000},
    {provider:"gemini",calls:145,cost:0.11,tokens:198000},
    {provider:"deepseek",calls:89,cost:0.08,tokens:132000},
    {provider:"claude",calls:42,cost:0.19,tokens:76000},
  ],
  tool_usage:[
    {tool:"web_search",count:245,success_rate:96},
    {tool:"run_code",count:198,success_rate:94},
    {tool:"web_scrape",count:132,success_rate:89},
    {tool:"read_file",count:87,success_rate:99},
  ],
  success_rate_trend:[
    {date:"2025-01-09",rate:80},{date:"2025-01-10",rate:92},
    {date:"2025-01-11",rate:67},{date:"2025-01-12",rate:100},
    {date:"2025-01-13",rate:83},{date:"2025-01-14",rate:95},{date:"2025-01-15",rate:82},
  ],
  avg_steps_per_task:3.4,
  total_tasks_all_time:89,
  total_cost_all_time:0.80,
}

export const mockCostSummary: CostSummary = {
  session_start:"2025-01-15T08:00:00Z",
  total_calls:24,total_input_tokens:18400,total_output_tokens:8200,total_tokens:26600,
  total_cost_usd:0.0026,budget_usd:1.0,budget_used_pct:0.26,
  by_provider:{
    groq:{calls:14,tokens:16800,cost:0.0015},
    gemini:{calls:6,tokens:6400,cost:0.0006},
    deepseek:{calls:4,tokens:3400,cost:0.0005},
  },
}
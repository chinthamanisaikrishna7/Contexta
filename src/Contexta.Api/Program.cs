using Dapper;
using Contexta.Api.Services;

DefaultTypeMap.MatchNamesWithUnderscores = true;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddHttpClient<OllamaEmbeddingClient>(c =>
{
    c.BaseAddress = new Uri(builder.Configuration["OllamaBaseUrl"] ?? "http://localhost:11434");
    c.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddSingleton<SearchService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("contextaFrontend", policy =>
        policy.WithOrigins(
                  "http://localhost:5173",
                  "https://localhost:5001",
                  "https://localhost:5002",
                  "https://develop.contextasystem.tech")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("contextaFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();

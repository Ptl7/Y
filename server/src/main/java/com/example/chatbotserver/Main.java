package com.example.chatbotserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@RestController
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

    @CrossOrigin(origins = "*")
    @PostMapping("/chat")
    public Response chat(@RequestBody Request request) {
        // Call your LLaMA model here and return the response
        String aiResponse = callLLaMAModel(request.getMessage());
        return new Response(aiResponse);
    }

    private String callLLaMAModel(String message) {
        // Implement the call to your LLaMA model here
        // This is a placeholder response
        return "Hello, this is a response from the AI!";
    }

    static class Request {
        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    static class Response {
        private String response;

        public Response(String response) {
            this.response = response;
        }

        public String getResponse() {
            return response;
        }

        public void setResponse(String response) {
            this.response = response;
        }
    }
}

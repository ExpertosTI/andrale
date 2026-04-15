FROM nginx:alpine

# Copy static assets to nginx html directory
COPY . /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# The default nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]

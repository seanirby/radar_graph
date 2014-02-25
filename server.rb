require 'webrick'

root = File.expand_path ""
puts "Starting server with root: #{root}"
server = WEBrick::HTTPServer.new :Port => 8000, :DocumentRoot => root

trap 'INT' do server.shutdown end

server.start
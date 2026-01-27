require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

env = {}
env_file = nil
search_path = __dir__
5.times do
  candidate = File.join(search_path, ".env")
  if File.exist?(candidate)
    env_file = candidate
    break
  end
  search_path = File.dirname(search_path)
end

raise "Missing .env file" if env_file.nil?

File.readlines(env_file).each do |line|
  line = line.strip
  next if line == "" || line.start_with?("#")
  key, value = line.split("=", 2)
  env[key] = value.gsub(/"/, "")
end

appSdkVersionId = env["IOS_APPSDK_VERSION"]
raise "No IOS_APPSDK_VERSION provided from .env file." if appSdkVersionId.nil? || appSdkVersionId.strip.empty?

Pod::Spec.new do |s|
  s.name         = "IaSdkCardLink"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/ihreapotheken/IA-SDK-React-Native"
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/ihreapotheken/IA-SDK-React-Native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)

  s.dependency 'IACardLink', appSdkVersionId
  s.dependency 'IaSdkCore'
end
